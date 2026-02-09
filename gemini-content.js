
// gemini-content.js
(function() {
    const params = new URLSearchParams(window.location.search);
    const promptText = params.get("prompt");
    
    if (!promptText) return;

    // Function to inject text into Gemini's input field
    function injectPrompt() {
        // Select the contenteditable div (standard for Gemini)
        const inputField = document.querySelector('div[contenteditable="true"][role="textbox"]');
        
        if (inputField) {
            inputField.focus();
            
            // Use execCommand for reliable text insertion in contenteditable
            // This mimics user typing better than setting innerHTML
            document.execCommand('insertText', false, promptText);
            
            // Dispatch input events to trigger framework listeners (Angular/Lit)
            inputField.dispatchEvent(new Event('input', { bubbles: true }));
            inputField.dispatchEvent(new Event('change', { bubbles: true }));

            // Optional: Click the send button if needed (usually users prefer to review first)
            // const sendButton = document.querySelector('button[aria-label="Send message"]');
            // if (sendButton) sendButton.click();

            // Clean up URL to prevent re-injection on reload
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("prompt");
            window.history.replaceState({}, document.title, newUrl.toString());
            
            return true;
        }
        return false;
    }

    // Observer to wait for the input field to appear (SPA loading)
    const observer = new MutationObserver((mutations, obs) => {
        if (injectPrompt()) {
            obs.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Fallback timeout in case observer misses or takes too long
    let attempts = 0;
    const interval = setInterval(() => {
        if (injectPrompt() || attempts > 20) { // 10 seconds max
            clearInterval(interval);
            observer.disconnect();
        }
        attempts++;
    }, 500);
})();
