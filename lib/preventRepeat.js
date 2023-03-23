import axios from 'axios'; // Import axios
class PreventRepeat { // Define a class
    pendingMap;
    CancelToken;

    constructor() {
        this.pendingMap = new Map(); // Create a Map object to store pending requests
        this.CancelToken = axios.CancelToken;
    }

    getPendingKey(config) { // Define a function to get the key of pending request
        let { url, method, params, data } = config; // Get request parameters
        if (typeof data === 'string') data = JSON.parse(data); // response里面返回的config.data是个字符串对象
        return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&'); // Return the key string of pending request
    }

    addPending(config) { // Define a function to add a pending request
        const pendingKey = this.getPendingKey(config); // Get the key of pending request
        config.cancelToken = config.cancelToken || new this.CancelToken((cancel) => { // Create a cancel token
            if (!this.pendingMap.has(pendingKey)) { // If the key of pending request does not exist in the Map object
                this.pendingMap.set(pendingKey, cancel); // Add it to the Map object
            }
        });
    }

    removePending(config) { // Define a function to remove a pending request
        const pendingKey = this.getPendingKey(config); // Get the key of pending request
        if (this.pendingMap.has(pendingKey)) { // If the key of pending request exists in the Map object
            const cancelToken = this.pendingMap.get(pendingKey); // Get the cancel token of this pending request
            cancelToken(pendingKey); // Cancel the pending request
            this.pendingMap.delete(pendingKey); // Remove the request from the Map object
        }
    }
}

export default PreventRepeat; // Export the class
