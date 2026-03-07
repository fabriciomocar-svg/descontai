# Segurança do Firestore - Instruções de Aplicação

Este arquivo contém as regras de segurança necessárias para proteger seu aplicativo Descontaí em produção.

## Como Aplicar as Regras

Você tem duas opções para aplicar estas regras:

### Opção 1: Via Console do Firebase (Mais Fácil)

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione seu projeto **descontai-app**.
3. No menu lateral, vá em **Criação** > **Firestore Database**.
4. Clique na aba **Regras**.
5. Copie todo o conteúdo do arquivo `firestore.rules` deste projeto.
6. Cole no editor do console, substituindo as regras existentes.
7. Clique em **Publicar**.

### Opção 2: Via Firebase CLI (Para Desenvolvedores)

Se você tiver o Firebase CLI instalado e configurado:

1. Abra o terminal na raiz do projeto.
2. Execute o comando:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Regras de Armazenamento (Storage)

Além do Firestore, também configuramos regras para o Firebase Storage para proteger seus arquivos.

### Como Aplicar as Regras de Storage

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Vá em **Criação** > **Storage**.
3. Clique na aba **Regras**.
4. Copie o conteúdo do arquivo `storage.rules`.
5. Cole no editor e clique em **Publicar**.

### O Que Estas Regras Fazem

*   **Leitura Pública:** Qualquer pessoa pode ver as imagens (necessário para o app funcionar).
*   **Logos e Capas:** Apenas o dono da loja pode fazer upload ou deletar seus próprios arquivos.
*   **Promoções:** Apenas o dono da promoção pode fazer upload de imagens/vídeos (limite de 50MB).
*   **Perfis:** Apenas o próprio usuário pode fazer upload de sua foto de perfil.

## Importante

Certifique-se de que os índices do Firestore estejam criados. Se você ver erros de "index needed" no console do navegador, clique no link fornecido na mensagem de erro para criar o índice automaticamente.
