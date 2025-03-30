# Sound Sift - AI-Powered Sample Search Assistant

Sound Sift is an innovative desktop application that helps music producers and sound designers quickly find the perfect samples in their library using AI-powered search capabilities.

## Features

- **Text-Based Search**: Describe the sound you're looking for in natural language - "punchy kicks", "lo-fi textures", "warm analog basslines"
- **Audio-Based Search**: Upload a reference sample to find similar sounds in your collection
- **Ultra-Fast Results**: Get instant matches sorted by similarity
- **Simple Interface**: Clean, intuitive design for distraction-free workflow

## Getting Started

### Installation

1 Run the executable file:
   - Windows: Double-click `Sound Sift.exe` in the `dist` folder

### First Launch Setup

1. When you launch Sound Sift for the first time, you'll be greeted with an onboarding screen
2. Click "Get Started" to select a folder containing your audio samples
3. Sound Sift will analyze your samples (this may take a few minutes depending on the size of your library)
4. Once the analysis is complete, you're ready to start searching!

## Using Sound Sift

### Text Search

1. Type descriptive terms in the search bar at the top of the interface
2. Hit Enter or click the search button
3. Browse through the results sorted by relevance
4. Click the play button on any result to preview the sound

### Audio Search

1. Drag and drop a reference audio file into the upload zone, or click to browse
2. Sound Sift will analyze the audio and find similar sounds in your library
3. Results will appear below, sorted by similarity percentage

### Tips for Better Results

- Be specific with your search terms: "bright metallic percussion" will yield better results than just "percussion"
- For more accurate audio searches, try to use reference samples that are clean and representative of what you're looking for
- Use the filter in results to narrow down by filename or other metadata

## Requirements

- Windows 10 or later / macOS 10.15+ / Ubuntu 18.04+
- 4GB RAM minimum, 8GB recommended
- 500MB free disk space for the application

## Troubleshooting

- **No samples showing up?** Make sure your audio files are in common formats (WAV, MP3, AIFF, FLAC)
- **Application not starting?** Check that you have the latest version and try running as administrator
- **Slow performance?** Large sample libraries may take longer to process initially

## Development

If you're interested in building Sound Sift from source:

1. Clone the repository
2. Install dependencies: `npm install`
3. Run in development mode: `npm run dev`
4. Build for your platform:
   - Windows: `npm run build:win`
   - macOS: `npm run build:mac`
   - Linux: `npm run build:linux`

## Support & Feedback

For issues, feature requests, or general feedback, please [open an issue](https://github.com/yourusername/sound-sift/issues) on our GitHub repository.

---

Happy sampling! 🎵
