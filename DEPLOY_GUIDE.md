# Deploy do Contrato NotarizeX - Guia Passo a Passo

## Opcao 1: Remix IDE (Recomendado para iniciantes)

### Passos:

1. **Acesse:** https://remix.ethereum.org/

2. **Crie novo arquivo:** Clique em `contracts` > `New File` > `NotarizeX.sol`

3. **Cole o codigo do contrato:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract NotarizeX {
    struct Notarization {
        address owner;
        string documentHash;
        string documentName;
        uint256 timestamp;
        uint256 blockNumber;
        bool exists;
    }

    struct SmartContract {
        address party1;
        address party2;
        string contractType;
        string termsHash;
        uint256 value;
        uint256 createdAt;
        uint256 expirationDate;
        bool active;
        address creator;
    }

    address public admin;
    uint256 public notarizationCount;
    uint256 public contractCount;

    mapping(bytes32 => Notarization) public notarizations;
    mapping(uint256 => SmartContract) public contracts;
    mapping(address => bytes32[]) public userNotarizations;
    mapping(address => uint256[]) public userContracts;

    event DocumentNotarized(bytes32 indexed hash, address indexed owner, string documentName, uint256 timestamp, uint256 blockNumber);
    event ContractCreated(uint256 indexed contractId, address indexed creator, address indexed party2, string contractType);
    event ContractSigned(uint256 indexed contractId, address indexed signer);
    event ContractCompleted(uint256 indexed contractId);
    event ContractCancelled(uint256 indexed contractId);

    constructor() {
        admin = msg.sender;
    }

    function notarize(string calldata documentHash, string calldata documentName) external returns (bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(documentHash));
        require(!notarizations[hash].exists, "Already notarized");

        notarizations[hash] = Notarization({
            owner: msg.sender,
            documentHash: documentHash,
            documentName: documentName,
            timestamp: block.timestamp,
            blockNumber: block.number,
            exists: true
        });

        userNotarizations[msg.sender].push(hash);
        notarizationCount++;
        emit DocumentNotarized(hash, msg.sender, documentName, block.timestamp, block.number);
        return hash;
    }

    function verify(bytes32 hash) external view returns (Notarization memory) {
        require(notarizations[hash].exists, "Not found");
        return notarizations[hash];
    }

    function exists(bytes32 hash) external view returns (bool) {
        return notarizations[hash].exists;
    }

    function getUserNotarizationCount(address user) external view returns (uint256) {
        return userNotarizations[user].length;
    }

    function createContract(
        address party2,
        string calldata contractType,
        string calldata termsHash,
        uint256 value,
        uint256 expirationDays
    ) external returns (uint256) {
        require(party2 != address(0), "Invalid address");

        uint256 contractId = contractCount++;
        contracts[contractId] = SmartContract({
            party1: msg.sender,
            party2: party2,
            contractType: contractType,
            termsHash: termsHash,
            value: value,
            createdAt: block.timestamp,
            expirationDate: block.timestamp + (expirationDays * 1 days),
            active: true,
            creator: msg.sender
        });

        userContracts[msg.sender].push(contractId);
        userContracts[party2].push(contractId);
        emit ContractCreated(contractId, msg.sender, party2, contractType);
        return contractId;
    }

    function signContract(uint256 contractId) external {
        SmartContract storage contract_ = contracts[contractId];
        require(contract_.active, "Not active");
        require(contract_.party2 == msg.sender, "Only party2");
        require(block.timestamp <= contract_.expirationDate, "Expired");
        emit ContractSigned(contractId, msg.sender);
    }

    function completeContract(uint256 contractId) external {
        SmartContract storage contract_ = contracts[contractId];
        require(contract_.active, "Not active");
        require(contract_.party1 == msg.sender || contract_.party2 == msg.sender, "Only parties");
        contract_.active = false;
        emit ContractCompleted(contractId);
    }

    function cancelContract(uint256 contractId) external {
        SmartContract storage contract_ = contracts[contractId];
        require(contract_.active, "Not active");
        require(contract_.party1 == msg.sender || contract_.party2 == msg.sender, "Only parties");
        contract_.active = false;
        emit ContractCancelled(contractId);
    }

    function getContract(uint256 contractId) external view returns (SmartContract memory) {
        return contracts[contractId];
    }

    function getUserContractCount(address user) external view returns (uint256) {
        return userContracts[user].length;
    }

    function updateAdmin(address newAdmin) external {
        require(msg.sender == admin, "Only admin");
        require(newAdmin != address(0), "Invalid admin");
        admin = newAdmin;
    }
}
```

4. **Compile:**
   - Va para aba `Solidity Compiler`
   - Selecione versao `0.8.19`
   - Clique em `Compile NotarizeX.sol`

5. **Deploy:**
   - Va para aba `Deploy & Run Transactions`
   - Ambiente: `Injected Provider - MetaMask`
   - Conecte sua carteira MetaMask
   - Certifique-se que esta na rede `Polygon`
   - Clique em `Deploy`
   - Confirme a transacao no MetaMask

6. **Copie o endereco do contrato** (ex: `0x1234567890...`)

7. **Adicione ao Netlify como variavel de ambiente:**
   ```
   VITE_NOTARIZE_CONTRACT_ADDRESS=0x_seu_endereco_aqui
   ```

---

## Opcao 2: Linha de Comando (Avancado)

Se preferir usar Hardhat localmente:

```bash
# 1. Clone o repo
git clone https://github.com/HenriqueGuilhermeUx/docwallet.git
cd docwallet

# 2. Instale deps
cd contracts && npm install

# 3. Compile
npx hardhat compile

# 4. Deploy
npx hardhat run scripts/deploy.ts --network polygon
```

---

## Verificar Deploy

Apos o deploy, voce pode verificar no Polygonscan:
- Acesse: https://polygonscan.com/
- Procure pelo endereco do contrato
- Vera todas as transacoes e eventos

---

## Custos Estimados

| Operacao | Custo MATIC |
|----------|-------------|
| Deploy contrato | ~0.01 MATIC |
| Notarize documento | ~0.0001 MATIC |
| Criar contrato | ~0.0002 MATIC |

---

## Suporte

Se precisar de ajuda, verifique:
- Se a carteira tem MATIC suficiente
- Se esta na rede Polygon (nao Mumbai)
- Se o Remix esta configurado com `Injected Provider`