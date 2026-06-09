import { redirect } from 'next/navigation'

// /signup just sends new users to the magic-link login page
export default function SignupPage() {
  redirect('/login')
}
