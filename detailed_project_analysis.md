# Vote India Secure - Detailed Project Analysis & Code Walkthrough

This document provides a deep dive into the **Vote India Secure** platform, mapping high-level features to specific code implementations.

---

## 1. Frontend: The Visual Layer
**Goal**: Create a premium, responsive interface for shareholders and admins.

### **Key Components & Code Evidence**
*   **Routing System**:
    *   **File**: `src/App.tsx`
    *   **Analysis**: Uses `react-router-dom` to manage navigation.
    *   **Example**:
        ```tsx
        <Route path="/company-register" element={<CompanyRegister />} />
        <Route path="/voting-dashboard" element={<VotingDashboard />} />
        ```
    *   **Why**: Enables a Single Page Application (SPA) feel—no page reloads.

*   **State Management (TanStack Query)**:
    *   **File**: `src/pages/VotingDashboard.tsx`
    *   **Analysis**: Instead of basic `useEffect`, we use `useQuery` for caching and auto-refetching data.
    *   **Innovation**: If a new vote is added, the dashboard can verify and update without a manual refresh.

*   **Design System (Shadcn UI + Tailwind)**:
    *   **File**: `src/components/ui/card.tsx`
    *   **Analysis**: Reusable components styled with Tailwind utility classes.
    *   **Example**: `className="rounded-lg border bg-card text-card-foreground shadow-sm"` ensures consistent dark/light mode theming automatically.

---

## 2. Backend: secure Serverless Logic
**Goal**: Handle sensitive operations (hashing, emails, AI) securely away from the client.

### **A. Innovation: AI Operations (`ai-ops`)**
*   **File**: `supabase/functions/ai-ops/index.ts`
*   **Mechanism**:
    1.  **Input**: Receives a `payload` (e.g., text to summarize) and an `action` type.
    2.  **Processing**: Sending a prompt to **Groq AI**.
    3.  **System Prompting**:
        ```typescript
        // Lines 29-31
        case 'summarize':
            systemPrompt = 'You are a helpful AI that summarizes documents...'
        ```
    4.  **Output**: Returns a JSON object with the summary or sentiment analysis.
*   **Why it matters**: Allows the app to process natural language (shareholder feedback/docs) instantly.

### **B. Security: OTP Verification (`send-email-otp`)**
*   **File**: `supabase/functions/send-email-otp/index.ts`
*   **Mechanism**:
    1.  **Generate**: Creates a 6-digit random code (Line 40).
    2.  **Persist**: Saves it to the `verification_codes` table (Lines 43-49).
    3.  **Deliver**: Uses **Resend API** to email the user (Lines 54-113).
*   **Why it matters**: Separates the "secret" (OTP) generation from the frontend, preventing tampering.

---

## 3. Database & Data Integrity
**Goal**: Ensure data is structured and access is strictly controlled.

### **Schema & Access Control (RLS)**
*   **File**: `supabase/migrations/...fix_votes_rls.sql` (and others)
*   **Key Table**: `votes`
*   **Security Policy**:
    ```sql
    CREATE POLICY vote_view ON public.votes
    FOR SELECT TO authenticated
    USING (shareholder_id IN (SELECT id FROM ... WHERE user_id=auth.uid()));
    ```
*   **Analysis**: Note the `USING` clause. This native Postgres feature ensures a user can **only** query their own votes. Even if a hacker tries to "Select All", the database returns only their own rows.

---

## 4. Major Innovation: Vote Hashing (Immutable Logs)
**Goal**: Prove that a vote has not been tampered with.

### **Implementation**
*   **File**: `src/lib/blockchain.ts`
*   **Function**: `generateVoteHash`
*   **Code references**:
    ```typescript
    // Lines 7-20
    export const generateVoteHash = async (shareholderId, resolutionId, voteValue, timestamp) => {
        const data = `${shareholderId}-${resolutionId}-${voteValue}-${timestamp}`;
        // Uses native Browser Crypto API for SHA-256
        const hashBuffer = await crypto.subtle.digest("SHA-256", ...);
        return `0x${hashHex}`; // Returns a hex string resembling a blockchain hash
    }
    ```
*   **How it works**:
    1.  Concatenates the vote details + timestamp.
    2.  Hashes them using standard SHA-256.
    3.  Stores this hash in the `votes` table.
*   **Benefit**: If an admin changes the `voteValue` in the DB later, the hash won't match the new data, exposing the fraud.

---

## 5. API Key Management
**Goal**: Connect to powerful tools without exposing credentials.

*   **Strategy**: All keys are stored in `supabase/.env` or Vercel Environment Variables.
    *   `GROQ_API_KEY`: For AI.
    *   `RESEND_API_KEY`: For Emails.
    *   `SUPABASE_SERVICE_ROLE_KEY`: For Admin tasks.
*   **Security**: These are never exposed to the frontend (Browser). Only the "Edge Functions" (server-side) can see them.

---

## 6. Summary of Innovations
1.  **AI-Driven Governance**: Summarizing AGM reports and answering FAQs automated by Groq.
2.  **Cryptographic Integrity**: Every vote is digitally "signed" (Hashed).
3.  **Serverless Architecture**: Scales infinitely with no server maintenance costs.
