# Cloud Functions - Limpeza Automática

Este diretório contém o código para as Cloud Functions do Firebase. A função principal é `cleanupExpiredPromotions`, que roda automaticamente todos os dias para remover promoções vencidas e liberar espaço no Storage.

## Estrutura de Arquivos

*   `functions/package.json`: Dependências do projeto (firebase-admin, firebase-functions).
*   `functions/tsconfig.json`: Configuração do TypeScript.
*   `functions/src/index.ts`: O código-fonte da função.

## Pré-requisitos

1.  Ter o [Node.js](https://nodejs.org/) instalado (versão 18 ou superior recomendada).
2.  Ter o [Firebase CLI](https://firebase.google.com/docs/cli) instalado:
    ```bash
    npm install -g firebase-tools
    ```
3.  Estar logado no Firebase:
    ```bash
    firebase login
    ```

## Como Configurar e Deployar

1.  **Inicializar o projeto:**
    Abra o terminal na pasta `functions` e instale as dependências:
    ```bash
    cd functions
    npm install
    ```

2.  **Compilar o TypeScript:**
    Ainda na pasta `functions`, compile o código:
    ```bash
    npm run build
    ```

3.  **Deployar a função:**
    Volte para a raiz do projeto e execute o deploy:
    ```bash
    cd ..
    firebase deploy --only functions
    ```

    *Nota: Se for o primeiro deploy, o Firebase pode pedir para você habilitar a API Cloud Build no console do Google Cloud. Siga o link que aparecer no erro se isso acontecer.*

## O que a função faz?

*   **Agendamento:** Roda todo dia à meia-noite (Horário de Brasília).
*   **Firestore:** Busca todas as promoções onde a data `expiresAt` é anterior a hoje.
*   **Storage:** Se a promoção tiver uma imagem ou vídeo, remove o arquivo correspondente do Firebase Storage para economizar espaço e custos.
*   **Batch:** Executa as exclusões no Firestore em lotes de 500 (limite da plataforma) para garantir que grandes volumes de dados sejam processados sem erro.

## Testando Localmente

Você pode testar a função localmente usando o emulador do Firebase:

1.  Na pasta `functions`, execute:
    ```bash
    npm run serve
    ```
2.  Isso iniciará um servidor local. Como é uma função agendada (PubSub), você pode testá-la via shell:
    ```bash
    npm run shell
    ```
    E depois chamar: `cleanupExpiredPromotions()`
