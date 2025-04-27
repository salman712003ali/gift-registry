import { createClient } from '@/utils/supabase/client'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  variables: Record<string, string>
}

interface SendEmailParams {
  to: string
  templateName: string
  variables: Record<string, string>
}

interface EmailProfile {
  email: string
}

export async function sendEmail({ to, templateName, variables }: SendEmailParams) {
  const supabase = createClient()

  try {
    // Fetch email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .single()

    if (templateError) throw templateError
    if (!template) throw new Error('Email template not found')

    const emailTemplate = template as EmailTemplate

    // Replace template variables
    let subject = emailTemplate.subject
    let content = emailTemplate.content

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      content = content.replace(regex, value)
    })

    // Send email using Edge function
    const { error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        content
      }
    })

    if (sendError) throw sendError

    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

export async function sendContributionNotification(
  registryOwnerId: string,
  contributorName: string,
  amount: number,
  registryTitle: string
) {
  const supabase = createClient()

  try {
    // Get registry owner's email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', registryOwnerId)
      .single()

    if (profileError) throw profileError
    if (!profile) throw new Error('Profile not found')

    const emailProfile = profile as EmailProfile

    // Send notification email
    return await sendEmail({
      to: emailProfile.email,
      templateName: 'contribution_received',
      variables: {
        amount: amount.toFixed(2),
        contributor: contributorName,
        registry: registryTitle
      }
    })
  } catch (error) {
    console.error('Failed to send contribution notification:', error)
    return { success: false, error }
  }
}

export async function sendThankYouEmail(
  contributorEmail: string,
  contributorName: string,
  amount: number,
  registryTitle: string,
  message?: string
) {
  try {
    return await sendEmail({
      to: contributorEmail,
      templateName: 'thank_you',
      variables: {
        contributor: contributorName,
        amount: amount.toFixed(2),
        registry: registryTitle,
        message: message || ''
      }
    })
  } catch (error) {
    console.error('Failed to send thank you email:', error)
    return { success: false, error }
  }
} 