# SmartERP Frontend — Security Policy & Vulnerability Disclosure

## 1. Overview & Security Philosophy

SmartERP (branded as **Prozync**) is a multi-tenant Enterprise Resource Planning (ERP) platform. As a frontend application interacting directly with authenticated users across various role tiers (Super Admin, Company Owner, HR, Employee, and Customer), security is treated as a core operational requirement.

We maintain a defense-in-depth architecture: frontend controls provide responsive validation and role-specific navigation, while strict authorization, multi-tenant scoping, and data boundaries are enforced server-side.

---

## 2. Supported Versions

Security updates and vulnerability remediation are actively applied to the primary release branch and supported environments:

| Branch / Release Target | Status | Supported Environments |
| :--- | :--- | :--- |
| `launch-hardening` | :white_check_mark: Active Maintenance | Staging & Production Targets |
| `main` | :white_check_mark: Supported | Production Releases (`prozync.in`) |
| Feature Branches (`feature/*`) | :x: Untracked | Development Only |

---

## 3. Reporting a Vulnerability

We appreciate responsible disclosure of security vulnerabilities by security researchers, developers, and users.

> [!IMPORTANT]
> **Do NOT report security vulnerabilities via public GitHub issues, discussions, or pull requests.**

### Reporting Channels
- **Primary Security Email:** `security@prozync.in` (or repository maintainers)
- **PGP Encryption:** Available upon request for high-severity vulnerability disclosures.
- **Alternative:** Submit a private GitHub Security Advisory via the repository's **Security > Advisories** tab if enabled.

### What to Include in Your Report
To help us triage and remediate the issue rapidly, please provide:
1. **Description:** Clear summary of the vulnerability (e.g., cross-site scripting, session leakage, token storage vulnerability, improper client-side routing).
2. **Reproduction Steps:** Step-by-step instructions or minimal proof-of-concept (PoC).
3. **Affected Endpoints / Components:** Specific URLs, components, or client-side modules involved.
4. **Impact Assessment:** Potential impact on user data, tenant isolation, or session integrity.
5. **Environment:** Browser version, OS, and commit hash tested.

---

## 4. Response Timeline & SLA

We take all disclosures seriously and adhere to the following response timeline:
- **Initial Acknowledgment:** Within **24–48 business hours** of receipt.
- **Triage & Validation:** Within **3 business days** confirming vulnerability reproduction and severity.
- **Remediation & Patching:** High/Critical severity issues are addressed within **7 business days** via emergency hotfix.
- **Coordinated Disclosure:** We request a **90-day embargo** from the date of initial report before public disclosure, allowing sufficient time to deploy fixes to production.

---

## 5. Security Architecture & In-Scope Areas

### In-Scope for Frontend Security Reviews
- **Cross-Site Scripting (XSS):** Stored, reflected, or DOM-based XSS in user input, chat messages, or document renders.
- **Authentication & Token Handling:** Secure management of JWT access tokens, refresh token serialization via Web Locks, and storage practices.
- **Client-Side Authorization Boundaries:** Validation that protected portal routes (`/owner/*`, `/superadmin/*`, `/customer/*`) fail closed upon session termination or token expiry.
- **Sensitive Data Exposure:** Accidental leakage of API keys, tenant identifiers of other companies, or PII in client bundles.
- **Cross-Origin Resource Sharing (CORS) & Content Security Policy (CSP):** Misconfigurations that allow unauthorized cross-origin data extraction.

### Out-of-Scope
- Denial of Service (DoS) attacks targeting network infrastructure or third-party CDNs.
- Social engineering, phishing, or physical attacks against employees or users.
- Vulnerabilities requiring root access or modified browser runtimes on the client device.
- Clickjacking on static marketing pages without state-changing actions.

---

## 6. Safe Harbor Policy

We consider security research conducted under this policy to be authorized. We will not pursue legal action against researchers who:
- Make a good-faith effort to avoid privacy violations, data destruction, and service interruption.
- Test only against accounts, tenants, and data they own or have explicit authorization to inspect.
- Do not access, modify, or exfiltrate another customer's or tenant's private business data.
- Maintain confidentiality until coordinated disclosure has concluded.
