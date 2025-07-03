export async function checkApiRoot() {
    try {
        const response = await fetch('http://127.0.0.1:8000/'); // Target your FastAPI root
        if (response.ok) {
            const data = await response.json();
            if (data) {
                console.log("API: Ponged");
            } else {
                console.log("API: No Pong");
            }
        } else {
            console.log(`API responded with error: ${response.status}`);
            return false;
        }
    } catch (error: any) {
        console.log(`API connection failed: ${error.message}`);
        return false;
    }
}