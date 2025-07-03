const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function HeartBeat() {
    console.log("API Request: ping");
    try {
        const response = await fetch(API_BASE_URL +'?ping=ping', {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            console.log("API Response:", data.ping);
            return true;
        } else {
            console.error(`API responded with error: ${response.status}`);
            return false;
        }
    } catch (error: any) {
        console.error(`API connection failed: ${error.message}`);
        return false;
    }
}