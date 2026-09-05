/**
 * E-mail de primeiro acesso enviado quando um membro é criado na equipe.
 *
 * Não viaja senha aqui: o link leva a pessoa direto para a tela "defina sua
 * senha", e ela escolhe a própria. Se o link expirar, o caminho de recuperação
 * ("Esqueci minha senha" na tela de login) funciona para quem foi convidado,
 * então o e-mail já explica isso para ninguém ficar travado.
 */

interface DadosConvite {
  nome: string
  emailLogin: string
  nomeOrganizacao: string
  link: string
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function assuntoEmailConvite(nomeOrganizacao: string): string {
  return `Seu acesso ao LyneImob — ${nomeOrganizacao}`
}

export function montarEmailConvite({ nome, emailLogin, nomeOrganizacao, link }: DadosConvite): string {
  const primeiroNome = escaparHtml(nome.trim().split(/\s+/)[0] || nome)
  const org = escaparHtml(nomeOrganizacao)
  const email = escaparHtml(emailLogin)
  const url = escaparHtml(link)

  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f4f7fc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#12203a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fc;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#0a5dc2,#063a8c);padding:28px 32px;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.85;">LyneImob</div>
            <div style="font-size:24px;font-weight:600;margin-top:6px;">Sua conta está pronta, ${primeiroNome}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;font-size:16px;line-height:1.6;">
            <p style="margin:0 0 14px;">Você foi adicionada à equipe da <strong>${org}</strong> no LyneImob, o sistema que organiza clientes, imóveis, negócios e agenda.</p>
            <p style="margin:0 0 22px;">Para entrar pela primeira vez, clique no botão abaixo e escolha a sua senha:</p>
            <p style="margin:0 0 26px;text-align:center;">
              <a href="${url}" style="display:inline-block;background:#0a5dc2;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:10px;">Definir minha senha</a>
            </p>
            <p style="margin:0 0 6px;font-size:14px;color:#4a5a76;">Seu login será este e-mail: <strong style="color:#12203a;">${email}</strong></p>
            <p style="margin:0 0 18px;font-size:14px;color:#4a5a76;">Se o botão não abrir, copie e cole este endereço no navegador:<br>
              <a href="${url}" style="color:#0a5dc2;word-break:break-all;">${url}</a></p>
            <hr style="border:none;border-top:1px solid #e8eef8;margin:18px 0;">
            <p style="margin:0;font-size:13px;color:#7e8ca6;line-height:1.5;">O link é de uso único. Se ele tiver expirado quando você abrir, vá até a tela de login, clique em <strong>Esqueci minha senha</strong> e informe este mesmo e-mail — você recebe um link novo na hora.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
