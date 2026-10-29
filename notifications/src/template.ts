function escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]!)
}

export function welcomeTemplate(appUrl: string) {
    return {
        subject: '¡Bienvenido a Arcoins Wallet!',
        text: [
            '¡Bienvenido a Arcoins Wallet!',
            'Tu cuenta se creó correctamente. Ya puedes entrar a la app para consultar tu billetera y organizar tus movimientos.',
            `Abre Arcoins Wallet: ${appUrl}`,
            'Este correo es informativo; no verifica tu dirección de correo.',
            'Arcoins nunca te pedirá tu contraseña, token o claves por correo.',
            'Si no realizaste este registro, puedes ignorar este mensaje.',
        ].join('\n\n'),
        html: `<!doctype html><html lang="es"><body style="font-family:Arial,sans-serif;color:#202333;background:#f4f5fa;padding:24px"><main style="max-width:560px;margin:auto;background:#fff;padding:32px;border-radius:16px"><p style="color:#6750a4;font-weight:bold">ARCOINS WALLET</p><h1>¡Te damos la bienvenida!</h1><p>Tu cuenta se creó correctamente. Ya puedes consultar tu billetera y organizar tus movimientos.</p><p><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#6750a4;color:#fff;padding:14px 20px;border-radius:8px;text-decoration:none">Abrir Arcoins Wallet</a></p><p>Este correo es informativo; no verifica tu dirección de correo.</p><p>Arcoins nunca te pedirá tu contraseña, token o claves por correo.</p><p style="font-size:12px;color:#666">Si no realizaste este registro, puedes ignorar este mensaje.</p></main></body></html>`,
    }
}
