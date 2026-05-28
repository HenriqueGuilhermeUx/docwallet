# Guia de Execução SQL - DocWallet

## PASSO A PASSO

Você tem 3 SQLs que precisam ser executados em ordem.

### 1. DELETE os SQLs antigos do Supabase

Antes de começar, delete os 3 SQLs antigos que estão dando erro:
- "Logs de compartilhamento, ..."
- "DocWallet Tables & Credits ..."
- "Estrutura de perfis, docume..."

### 2. Acesse o SQL Editor
https://supabase.com/dashboard/project/myjzilyiytrcndyyxwxj/sql/new

### 3. Execute na ORDEM:

#### PRIMEIRO: SQL_01_estrutura_perfis_documentos.sql
Copie o conteúdo do arquivo `SQL_01_estrutura_perfis_documentos.sql`
Cole no editor e clique em **RUN**

#### SEGUNDO: SQL_02_docwallet_tables_credits.sql
Copie o conteúdo do arquivo `SQL_02_docwallet_tables_credits.sql`
Cole no editor e clique em **RUN**

#### TERCEIRO: SQL_03_logs_compartilhamento.sql
Copie o conteúdo do arquivo `SQL_03_logs_compartilhamento.sql`
Cole no editor e clique em **RUN**

---

## ARQUIVOS CRIADOS

Estes arquivos estão prontos para uso:

| Arquivo | Descrição |
|---------|-----------|
| `SQL_01_estrutura_perfis_documentos.sql` | Perfis e Documentos |
| `SQL_02_docwallet_tables_credits.sql` | Créditos e Blockchain |
| `SQL_03_logs_compartilhamento.sql` | Compartilhamento |

---

## SE DER ERRO

Se aparecer "policy already exists" ou "table already exists":
- Esses erros são OK - significa que já existe
- Continue para o próximo SQL

Se aparecer outro erro:
- Copie a mensagem de erro exata
- Me envie para eu corrigir
