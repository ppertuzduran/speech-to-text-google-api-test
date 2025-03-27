# Speech-to-Text Application with Google Cloud Speech-to-Text API

A real-time speech-to-text application that uses Google Cloud Speech-to-Text API to transcribe audio from the microphone. The application features a web interface with WebSocket communication for real-time transcription updates.

## Features

- Real-time audio recording from microphone
- WebSocket communication for live transcription updates
- Support for Spanish language (es-ES)
- Enhanced speech recognition model
- Modern web interface with status indicators
- Detailed logging for debugging

## Prerequisites

- Python 3.7 or higher
- Google Cloud Platform account
- Google Cloud Speech-to-Text API enabled
- Google Cloud credentials file (JSON key)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd speech-to-text-google-api-test
```

2. Install the required Python packages:

```bash
pip install -r requirements.txt
```

3. Set up Google Cloud credentials:
   - Create a service account in Google Cloud Console
   - Download the JSON key file
   - Place the key file in the project root directory as `s2t-api-demo-march-2025-key.json`

## Project Structure

```
speech-to-text-google-api-test/
├── main.py                 # FastAPI backend server
├── static/
│   ├── index.html         # Main HTML page
│   ├── app.js             # Frontend JavaScript
│   └── styles.css         # CSS styles
├── s2t-api-demo-march-2025-key.json  # Google Cloud credentials
└── README.md              # This file
```

## Configuration

The application uses the following configuration:

- Audio format: WebM with OPUS codec
- Language: Spanish (es-ES)
- Chunk size: 2 seconds (can be changed for testing)
- Buffer size: 75KB (can be changed for testing)

## Running the Application

1. Start the server:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8080 --log-level debug
```

2. Open your web browser and navigate to:

```
http://127.0.0.1:8080
```

3. Click the "Start Recording" button to begin transcription
4. Speak clearly in Spanish
5. Click "Stop Recording" to end the session

## Technical Details

### Frontend

- Uses MediaRecorder API for audio capture
- WebSocket for real-time communication
- Detailed console logging

### Backend

- FastAPI server with WebSocket support
- Google Cloud Speech-to-Text API integration
- Asynchronous audio processing
- Comprehensive error handling and logging

## Troubleshooting

### Common Issues

1. No transcription results:

   - Check browser console for WebSocket connection status
   - Verify Google Cloud credentials are valid
   - Ensure microphone permissions are granted

2. Audio not being recorded:

   - Check browser console for MediaRecorder errors
   - Verify microphone is properly connected
   - Check browser permissions

3. WebSocket connection issues:
   - Verify server is running
   - Check browser console for connection errors
   - Ensure no firewall is blocking WebSocket connections

### Debugging

- Enable browser developer tools (F12)
- Check the Console tab for frontend logs
- Monitor server terminal for backend logs
- Look for any error messages in both places

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Cloud Speech-to-Text API
- FastAPI framework
- WebSocket protocol
- MediaRecorder API
