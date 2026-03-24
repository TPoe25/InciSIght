// app/login/page.tsx
"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

// Login page component to handle user login
export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Function to handle user login using NextAuth's signIn method
    const handleLogin = async () => {
        await signIn("credentials", {
            email,
            password,
            callbackUrl: "/dashboard"
        })
    }
    // Render the login form with email and password inputs and a login button
    return (
        <div>
            <h1>Login</h1>
            <input onChange={e => setEmail(e.target.value)} />
            <input onChange={e => setPassword(e.target.value)} type="password" />
            <button onClick={handleLogin}>Login</button>
        </div>
    )
}
