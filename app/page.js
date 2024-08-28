'use client';
import { Box, Button, Stack, TextField } from '@mui/material';
import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ]);
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    const processText = async ({ done, value }) => {
      if (done) return result;
      const text = decoder.decode(value || new Uint8Array(), { stream: true });
      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1];
        let otherMessages = messages.slice(0, messages.length - 1);
        return [
          ...otherMessages,
          { ...lastMessage, content: lastMessage.content + text },
        ];
      });
      return reader.read().then(processText);
    };
    await reader.read().then(processText);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start" // Align to the top of the page
      alignItems="flex-start" // Align to the left of the page
      sx={{
        backgroundImage: 'url(/ratemy.jpg)',
        backgroundSize: 'contain', // Adjust this value to control the image size
        backgroundPosition: 'top right', // Position image to top-left
        backgroundRepeat: 'no-repeat', // Prevent repeating the image
        padding: 2,
      }}
    >
      <Stack
        direction={'column'}
        width="100%"
        maxWidth="600px"
        height="80%"
        maxHeight="800px"
        borderRadius={8}
        overflow="hidden"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
          marginTop: 2, // Add margin-top to move it away from the top edge
          border: '2px solid black', // Black border for the chat box
        }}
        p={2}
        spacing={2}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={2}
                maxWidth="70%"
                sx={{
                  wordBreak: 'break-word', 
                }}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction={'row'} spacing={1}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{
              '& .MuiInputBase-input': {
                padding: '12px', 
              },
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            sx={{
              height: '100%', 
              minWidth: '80px', 
            }}
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
