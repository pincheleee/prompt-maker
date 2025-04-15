import { useState } from 'react'
import {
  ChakraProvider,
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  Textarea,
  useToast,
  Container,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react'

function App() {
  const [keywords, setKeywords] = useState('')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const toast = useToast()

  const generatePrompt = () => {
    if (!keywords.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some keywords',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const promptTemplate = `Create a ${tone} response about ${keywords}. 
    The response should be ${length} in length and focus on the key aspects of the topic.
    Please provide detailed information while maintaining a ${tone} tone throughout.`

    setGeneratedPrompt(promptTemplate)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt)
    toast({
      title: 'Copied!',
      description: 'Prompt copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  return (
    <ChakraProvider>
      <Container maxW="container.md" py={10}>
        <VStack spacing={8} align="stretch">
          <Heading textAlign="center" color="blue.600">
            LLM Prompt Generator
          </Heading>
          
          <Text textAlign="center" color="gray.600">
            Enter keywords or phrases to generate an optimized prompt for your LLM
          </Text>

          <FormControl>
            <FormLabel>Keywords or Phrases</FormLabel>
            <Input
              placeholder="Enter keywords separated by commas"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Tone</FormLabel>
            <Select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="academic">Academic</option>
              <option value="friendly">Friendly</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Length</FormLabel>
            <Select value={length} onChange={(e) => setLength(e.target.value)}>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </Select>
          </FormControl>

          <Button colorScheme="blue" onClick={generatePrompt}>
            Generate Prompt
          </Button>

          {generatedPrompt && (
            <Box>
              <FormLabel>Generated Prompt</FormLabel>
              <Textarea
                value={generatedPrompt}
                readOnly
                rows={6}
                mb={2}
              />
              <Button colorScheme="green" onClick={copyToClipboard}>
                Copy to Clipboard
              </Button>
            </Box>
          )}
        </VStack>
      </Container>
    </ChakraProvider>
  )
}

export default App
