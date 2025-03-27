class SpeechToText {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.ws = null;
        this.clientId = Math.random().toString(36).substring(7);
        this.chunkBuffer = [];
        this.chunkBufferSize = 0;
        this.MAX_BUFFER_SIZE = 75000; // 50KB buffer
        this.lastChunkTime = 0;
        
        // DOM elements
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.transcription = document.getElementById('transcription');
        
        // Bind event listeners
        this.startButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());
        
        // Initialize WebSocket connection
        this.connectWebSocket();
    }
    
    connectWebSocket() {
        console.log('Attempting to connect to WebSocket server...');
        this.ws = new WebSocket(`ws://${window.location.host}/ws/${this.clientId}`);
        
        this.ws.onopen = () => {
            console.log('✅ WebSocket connected successfully');
            this.updateStatus('Connected to server');
        };
        
        this.ws.onmessage = (event) => {
            console.log('📥 Received transcription from server:', event.data);
            const transcript = event.data;
            this.transcription.textContent += transcript + ' ';
            console.log('✅ Updated transcription in UI');
        };
        
        this.ws.onclose = () => {
            console.log('❌ WebSocket disconnected');
            this.updateStatus('Disconnected from server');
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.updateStatus('Connection error');
        };
    }
    
    async startRecording() {
        try {
            console.log('🎤 Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 48000,
                    sampleSize: 16,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
            console.log('✅ Microphone access granted');
            
            // Check supported MIME types
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';
            
            console.log('🎙️ Using MIME type:', mimeType);
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            });
            console.log('🎙️ MediaRecorder initialized');
            
            this.mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const currentTime = Date.now();
                    const timeSinceLastChunk = currentTime - this.lastChunkTime;
                    this.lastChunkTime = currentTime;
                    
                    console.log(`📦 Audio chunk size: ${event.data.size} bytes, Time since last chunk: ${timeSinceLastChunk}ms`);
                    
                    // Only process chunks if enough time has passed
                    if (timeSinceLastChunk > 1000) { // Minimum 1 second between chunks
                        this.chunkBuffer.push(event.data);
                        this.chunkBufferSize += event.data.size;
                        
                        // If buffer is large enough, send it
                        if (this.chunkBufferSize >= this.MAX_BUFFER_SIZE) {
                            await this.sendBuffer();
                        }
                    }
                }
            };
            
            console.log('▶️ Starting audio recording...');
            this.mediaRecorder.start(1000); // 1-second chunks
            this.isRecording = true;
            this.lastChunkTime = Date.now();
            
            // Update UI
            this.startButton.disabled = true;
            this.stopButton.disabled = false;
            this.statusIndicator.classList.add('recording');
            this.updateStatus('Recording...');
            console.log('✅ Recording started and UI updated');
            
        } catch (error) {
            console.error('❌ Error accessing microphone:', error);
            this.updateStatus('Error accessing microphone');
        }
    }
    
    async sendBuffer() {
        if (this.chunkBuffer.length === 0) return;
        
        try {
            // Combine chunks into a single Blob
            const blob = new Blob(this.chunkBuffer, { type: this.chunkBuffer[0].type });
            console.log(`📤 Sending audio buffer of size: ${blob.size} bytes`);
            
            // Send the combined buffer
            this.ws.send(blob);
            console.log('✅ Audio buffer sent successfully');
            
            // Clear the buffer
            this.chunkBuffer = [];
            this.chunkBufferSize = 0;
        } catch (error) {
            console.error('❌ Error sending audio buffer:', error);
        }
    }
    
    async stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            console.log('⏹️ Stopping recording...');
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Send any remaining chunks
            if (this.chunkBuffer.length > 0) {
                await this.sendBuffer();
            }
            
            // Stop all tracks
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            console.log('✅ All audio tracks stopped');
            
            // Update UI
            this.startButton.disabled = false;
            this.stopButton.disabled = true;
            this.statusIndicator.classList.remove('recording');
            this.updateStatus('Recording stopped');
            console.log('✅ UI updated after stopping recording');
        }
    }
    
    updateStatus(message) {
        this.statusText.textContent = message;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Application initializing...');
    new SpeechToText();
}); 