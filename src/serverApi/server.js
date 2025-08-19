import axios from 'axios';


export const serverUrl = 'http://localhost:4000'

export const getAllNodesAPI = async () => {
    let url = `${serverUrl}/api/nodes`

    try {
        const getAllNodesAPIResponse = await axios.get(url)
        return getAllNodesAPIResponse;
    } catch (error) {
        return error;
    }
};


export const disconnectedNodeAPI = async (nodeId) => {
    let url = `${serverUrl}/api/nodes/${encodeURIComponent(nodeId)}/disconnect`

    try {
        const disconnectedNodeAPIResponse = await axios.post(url)
        return disconnectedNodeAPIResponse;
    } catch (error) {
        return error;
    }
};


export const uploadFileAPI = async (formData) => {
    let url = `${serverUrl}/api/upload`
    try {
        const uploadFileAPIResponse = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return uploadFileAPIResponse;
    } catch (error) {
        return error;
    }
};

