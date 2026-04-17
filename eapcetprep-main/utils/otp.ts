// ===== MESSAGECENTRAL IMPLEMENTATION (COMMENTED OUT) =====

const OTP_API_BASE = 'https://cpaas.messagecentral.com/verification/v3'
const AUTH_TOKEN = process.env.OTP_AUTH_TOKEN
const CUSTOMER_ID = process.env.OTP_CUSTOMER_ID

export async function sendOTP(phoneNumber: string): Promise<{
  success: boolean
  verificationId?: string
  error?: string
}> {
  // Check if OTP service credentials are configured
  if (!AUTH_TOKEN || !CUSTOMER_ID) {
    console.error('OTP service credentials not configured')
    console.error('OTP_AUTH_TOKEN:', AUTH_TOKEN ? 'SET' : 'MISSING')
    console.error('OTP_CUSTOMER_ID:', CUSTOMER_ID ? 'SET' : 'MISSING')
    return {
      success: false,
      error: 'OTP service is not configured. Please contact support.'
    }
  }

  try {
    console.log('Calling OTP API for phone:', phoneNumber)
    const response = await fetch(
      `${OTP_API_BASE}/send?countryCode=91&customerId=${CUSTOMER_ID}&flowType=SMS&mobileNumber=${phoneNumber}`,
      {
        method: 'POST',
        headers: {
          'authToken': AUTH_TOKEN
        }
      }
    )

    const data = await response.json()
    console.log('OTP API response status:', response.status)
    console.log('OTP API response data:', JSON.stringify(data))

    if (data.responseCode === 200) {
      console.log('OTP sent successfully, verification ID:', data.data?.verificationId)
      return {
        success: true,
        verificationId: data.data?.verificationId
      }
    }

    // Map provider-specific errors to user-friendly messages (e.g. MessageCentral "Pricing not found" = SMS plan not configured)
    const rawMessage = data.message || data.data?.errorMessage || 'Unknown error'
    const userMessage =
      rawMessage.toLowerCase().includes('pricing not found')
        ? 'OTP service is temporarily unavailable. Please try again later or contact support.'
        : rawMessage

    console.error('OTP API returned error:', rawMessage)
    return {
      success: false,
      error: userMessage
    }
  } catch (error) {
    console.error('OTP API request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? `Failed to send OTP: ${error.message}` : 'Failed to send OTP'
    }
  }
}

export async function verifyOTP(phoneNumber: string, verificationId: string, code: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(
      `${OTP_API_BASE}/validateOtp?countryCode=91&mobileNumber=${phoneNumber}&verificationId=${verificationId}&customerId=${CUSTOMER_ID}&code=${code}`,
      {
        method: 'GET',
        headers: {
          'authToken': AUTH_TOKEN!
        }
      }
    )

    const data = await response.json()

    if (data.responseCode === 200 && data.data.verificationStatus === 'VERIFICATION_COMPLETED') {
      return {
        success: true
      }
    }

    return {
      success: false,
      error: data.message || 'Invalid OTP'
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to verify OTP'
    }
  }
}

// // ===== TWILIO IMPLEMENTATION =====
// const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
// const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
// const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID

// export async function sendOTP(phoneNumber: string): Promise<{
//   success: boolean
//   verificationId?: string
//   error?: string
// }> {
//   try {
//     console.log('Sending OTP via Twilio to:', phoneNumber)

//     // Format phone number with country code
//     const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
//     console.log('Formatted phone number:', formattedPhone)

//     const response = await fetch(
//       `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
//         },
//         body: new URLSearchParams({
//           To: formattedPhone,
//           Channel: 'sms'
//         })
//       }
//     )

//     const data = await response.json()
//     console.log('Twilio send OTP response:', data)

//     if (response.ok && data.status === 'pending') {
//       return {
//         success: true,
//         verificationId: data.sid // Twilio returns SID as verification ID
//       }
//     }

//     return {
//       success: false,
//       error: data.message || 'Failed to send OTP'
//     }
//   } catch (error) {
//     console.error('Twilio send OTP error:', error)
//     return {
//       success: false,
//       error: 'Failed to send OTP'
//     }
//   }
// }

// export async function verifyOTP(phoneNumber: string, verificationId: string, code: string): Promise<{
//   success: boolean
//   error?: string
// }> {
//   try {
//     console.log('Verifying OTP via Twilio for:', phoneNumber)
//     console.log('Verification ID:', verificationId)
//     console.log('Code:', code)

//     // Format phone number with country code
//     const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
//     console.log('Formatted phone number:', formattedPhone)

//     const response = await fetch(
//       `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
//         },
//         body: new URLSearchParams({
//           To: formattedPhone,
//           Code: code
//         })
//       }
//     )

//     const data = await response.json()
//     console.log('Twilio verify OTP response:', data)

//     if (response.ok && data.status === 'approved') {
//       return {
//         success: true
//       }
//     }

//     return {
//       success: false,
//       error: data.message || 'Invalid OTP'
//     }
//   } catch (error) {
//     console.error('Twilio verify OTP error:', error)
//     return {
//       success: false,
//       error: 'Failed to verify OTP'
//     }
//   }
// } 