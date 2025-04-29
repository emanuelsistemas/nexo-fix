# Configuração de Variáveis de Ambiente

Este projeto requer as seguintes variáveis de ambiente para funcionar corretamente:

## Variáveis Obrigatórias

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
VITE_ADMIN_PASSWORD=senha_para_acesso_admin
```

## Instruções

1. Crie um arquivo `.env` na raiz do projeto
2. Adicione as variáveis acima com seus respectivos valores
3. **IMPORTANTE**: A variável `VITE_ADMIN_PASSWORD` é necessária para acessar a tela de cadastro de novos usuários

## Observações de Segurança

* Não compartilhe suas credenciais
* Não faça commit do arquivo `.env` no repositório
* Mantenha a senha de administrador em um local seguro
