---
sidebar_position: 2
---

# Voice Control (Universal Mic)

Zygotrix AI features a powerful voice control system that lets you interact with the application using natural speech. The Universal Mic provides hands-free navigation, voice commands, and dictation capabilities.

## Overview

The Universal Mic is always visible in the header as a **magic wand icon**. It provides:

- **Voice Commands** - Navigate the app, toggle settings, and execute actions
- **Dictation Mode** - Speak your messages instead of typing
- **AI Responses** - Get spoken feedback powered by OpenAI
- **Customizable Voice** - Adjust speed, pitch, and voice character

## Getting Started

### Activating Voice Control

Click the **magic wand button** in the header to activate voice control:

- **Inactive State**: Gray circular button with magic wand icon
- **Active State**: Emerald green button with animated sparkle

When activated, the AI will greet you with a welcome message like:

> "Hi! I'm your voice assistant for Zygotrix. How can I help you today?"

### Deactivating Voice Control

Say any of these commands to stop listening:

- "bye" / "bye bye"
- "goodbye"
- "exit" / "quit"
- "close yourself"
- "stop listening"

The AI will respond with a farewell and automatically turn off.

## Voice Commands

### Navigation Commands

| Command                         | Action                       |
| ------------------------------- | ---------------------------- |
| "Go to settings"                | Opens the Settings page      |
| "Go to chat"                    | Opens the AI Chat page       |
| "New chat" / "New conversation" | Starts a new chat            |
| "Open sidebar"                  | Opens/expands the sidebar    |
| "Close sidebar"                 | Closes/collapses the sidebar |

### Utility Commands

| Command                         | Action                               |
| ------------------------------- | ------------------------------------ |
| "Toggle theme" / "Switch theme" | Switches between light and dark mode |
| "Show usage"                    | Opens your usage statistics          |
| "Search for [query]"            | Searches your conversations          |
| "Clear search"                  | Clears the search input              |

### Conversational Commands

| Command                    | Response                     |
| -------------------------- | ---------------------------- |
| "Hi" / "Hello" / "Hey"     | Friendly greeting response   |
| "Bye" / "Goodbye" / "Exit" | Farewell and deactivates mic |

### Unrecognized Commands

If you say something the AI doesn't recognize, it will politely respond:

> "I'm sorry, I don't have that ability yet. Would you like me to help with navigation, settings, or something else?"

## Dictation Mode

When you focus on the chat input field, voice control switches to **dictation mode**:

1. Click on the chat input field
2. Start speaking your message
3. Watch your words appear in real-time
4. Press Enter or click Send when done

**Visual Indicator**: A premium floating pill appears at the top of the screen showing:

- Mic icon with pulse animation
- "Listening..." label
- Live transcript of your speech
- Sound wave visualizer

## Voice Settings

Customize your AI assistant's voice in **Settings → Voice**:

### Voice Character

Choose from available system voices. Each voice has a unique personality:

- Different accents (US, UK, Australian, etc.)
- Male and female options
- Multiple languages supported

### Speaking Speed (Rate)

Adjust how fast the AI speaks:

- **Slow (0.5x)** - For careful listening
- **Normal (1.0x)** - Standard speed
- **Default (1.2x)** - Slightly faster, natural flow
- **Fast (2.0x)** - Quick responses

### Voice Pitch

Adjust the tone of the voice:

- **Low (0.5)** - Deeper voice
- **Normal (1.0)** - Standard pitch
- **High (2.0)** - Higher voice

### Preview Button

Click "Preview Voice" to hear a sample with your current settings:

> "Hello! This is how I sound with your current settings. I'm your Zygotrix voice assistant."

### Reset to Defaults

One-click reset returns settings to:

- Rate: 1.2x
- Pitch: 1.0
- Voice: First available

## Technical Details

### How It Works

1. **Speech Recognition**: Uses the Web Speech API (`SpeechRecognition`) to convert speech to text
2. **Intent Analysis**: OpenAI GPT-4o-mini analyzes the transcript and matches it to available commands
3. **Command Execution**: The matched command is executed
4. **Voice Response**: Text-to-Speech (`speechSynthesis`) speaks the response

### AI-Powered Responses

Voice responses are generated dynamically by AI, not hardcoded:

- **Welcome Message**: Generated when mic activates
- **Fallback Response**: Generated when no command matches
- **Error Handling**: Spoken feedback on errors

### Browser Compatibility

| Browser | Speech Recognition | Text-to-Speech |
| ------- | ------------------ | -------------- |
| Chrome  | Full support       | Full support   |
| Edge    | Full support       | Full support   |
| Safari  | Partial            | Full support   |
| Firefox | Not supported      | Full support   |

:::tip
For the best experience, use **Google Chrome** or **Microsoft Edge**.
:::

### Permissions

Voice control requires microphone permission:

1. Click the mic button
2. Browser will prompt for permission
3. Click "Allow" to enable voice control

## Troubleshooting

### "Voice control not working"

1. Check that your browser supports Speech Recognition (Chrome/Edge recommended)
2. Ensure microphone permission is granted
3. Check that your microphone is not muted at the system level

### "Commands not recognized"

- Speak clearly and at a normal pace
- Wait for the speech to be processed before speaking again
- Try rephrasing your command

### "No audio response"

1. Check your system volume
2. Go to **Settings → Voice** and click "Preview Voice"
3. Try selecting a different voice character

### "Wrong voice selected"

1. Go to **Settings → Voice**
2. Select a different voice from the dropdown
3. Click "Preview Voice" to test
4. Settings are saved automatically

## Best Practices

### For Voice Commands

**Do**: Use clear, direct commands

> "Go to settings"

**Don't**: Use complex sentences

> "I would like to maybe go to the settings page if possible"

### For Dictation

**Do**: Speak in complete thoughts, pause naturally

> "What is the result of crossing Aa with Aa"

**Don't**: Speak too fast or mumble

> "whatistheresultofcrossingaawithaa"

### For Best Recognition

- Minimize background noise
- Speak at a moderate pace
- Use a quality microphone
- Keep reasonable distance from mic

## Privacy

- Voice data is processed locally by your browser's Speech Recognition API
- Transcripts are sent to OpenAI for intent analysis
- No audio recordings are stored
- Voice settings are saved locally in your browser

## API Reference

For developers, the Voice Control system is exposed via React Context:

```jsx
import { useVoiceControl } from "../contexts";

const MyComponent = () => {
  const {
    isListening, // Boolean: is mic active
    toggleListening, // Function: toggle mic on/off
    speak, // Function: speak text
    registerCommand, // Function: add custom command
    voiceSettings, // Object: current settings
    setVoiceSettings, // Function: update settings
  } = useVoiceControl();

  return (
    <button onClick={toggleListening}>
      {isListening ? "Stop" : "Start"} Listening
    </button>
  );
};
```

### Registering Custom Commands

```jsx
useEffect(() => {
  const unregister = registerCommand(
    "my-command", // Unique ID
    (text) => {
      // Action function
      console.log("Command triggered!", text);
      speak("Executing my command");
    },
    "Description for AI to match against"
  );

  return unregister; // Cleanup on unmount
}, [registerCommand, speak]);
```
