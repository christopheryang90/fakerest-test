
## 🏃 Running the Project

To keep iteration fast and lightweight(given that this is a small project), I setup the project to run TypeScript **without compiling**. You can execute it directly via:

```sh
make run
```

## 📦 Handling NDJSON

While fetching data, I realized that the API **returns NDJSON** (newline-delimited JSON). I made the decsion to **process it line by line** instead of converting all lines into a standard Json array, so we can reject only the malformed lines and process the analysis on the remainging data. I understand this may not always be the right decsion in every project, considering if large amounts of the data are malformed the analysis results would be unhelpful. 

## 📊 Data Interpretation Choices

I went with my best judgement on analysis requirements that I wasn't 100% sure on:

- **Most common first name in all cities** → Only counts **users**, and none of their friends.  
- **Most common hobby of all friends of users in all cities** → Includes **friends’ hobbies**, since friends is mentioned explicitly


## 🛡️ Security Considerations

This is a small test project, but if it were being used in production, here are some ideas top of my mind that would need to be addressed:

### **Handling API Keys Securely**
If the API required authentication (e.g., API keys or OAuth), we’d make sure to **store credentials in environment variables/vaults/secretes**, not in the code.

### **Keeping Logs Clean & Safe**
- Errors currently go to `stderr`, which is fine, but in a real system, **we wouldn’t want to log full API responses** if they contain sensitive data.  
- If this were handling real user data, we’d need to **make sure logs don’t leak personal info (PII)**.

### **Dealing with Malicious Input**
- Since we’re **parsing NDJSON line by line**, it’s possible for an attacker to sneak in **malicious payloads**.
- A **sanitization step** before processing untrusted data would help prevent issues.



