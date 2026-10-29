export function getMailConfig(env: NodeJS.ProcessEnv = process.env) {
    const region = env.AWS_REGION?.trim()
    const fromEmail = env.SES_FROM_EMAIL?.trim()
    const appUrl = new URL(env.ARCOINS_APP_URL || '')
    if (!region || !fromEmail || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fromEmail) ||
        appUrl.protocol !== 'https:' || appUrl.username || appUrl.password) {
        throw new Error('Configuración de correo inválida.')
    }
    return { region, fromEmail, appUrl: appUrl.origin }
}
