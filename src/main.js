// src/main.js
import { BrowserProvider, getDefaultProvider } from 'ethers';
import { create } from 'ipfs-http-client';
import contentHash from 'content-hash';
import DOMPurify from 'dompurify';

console.log('Script loaded successfully.');

// Initialize IPFS client
const ipfs = create({ url: 'https://ipfs.io/api/v0' });
console.log('IPFS client initialized.');

// Initialize Ethereum provider
let provider;

if (window.ethereum) {
  console.log('MetaMask detected. Initializing BrowserProvider.');
  provider = new BrowserProvider(window.ethereum);
} else {
  console.log('MetaMask not detected. Using default provider.');
  provider = getDefaultProvider('mainnet');
}

async function loadENSContent(ensName) {
  console.log(`Attempting to load content for ENS name: ${ensName}`);
  try {
    // Request access to the user's Ethereum account if using MetaMask
    if (window.ethereum) {
      console.log('Requesting account access...');
      await provider.send('eth_requestAccounts', []);
      console.log('Account access granted.');
    }

    // Get the resolver for the ENS name
    console.log('Fetching resolver...');
    const resolver = await provider.getResolver(ensName);
    if (!resolver) {
      throw new Error('Resolver not found for ENS name');
    }
    console.log('Resolver obtained:', resolver);

    // Get the content hash
    console.log('Fetching content hash...');
    const contentHashRaw = await resolver.getContentHash();
    if (!contentHashRaw) {
      throw new Error('Content hash not set for ENS name');
    }
    console.log('Content hash obtained:', contentHashRaw);

    // Decode the content hash to get the IPFS CID
    console.log('Decoding content hash...');
    const cid = contentHash.decode(contentHashRaw);
    console.log('Decoded CID:', cid);

    // Check if content is cached
    console.log('Checking sessionStorage for cached content...');
    const cachedContent = sessionStorage.getItem(ensName);
    if (cachedContent) {
      console.log('Cached content found. Displaying cached content.');
      document.getElementById('content').innerHTML = cachedContent;
      return;
    }

    // Fetch content from IPFS
    console.log('Fetching content from IPFS...');
    const content = await fetchIPFSContent(cid);
    console.log('Content fetched from IPFS:', content);

    // Sanitize content
    console.log('Sanitizing content...');
    const sanitizedContent = DOMPurify.sanitize(content);
    console.log('Sanitized content:', sanitizedContent);

    // Cache content in sessionStorage
    console.log('Caching content in sessionStorage...');
    sessionStorage.setItem(ensName, sanitizedContent);

    // Display content
    console.log('Displaying content on the page.');
    document.getElementById('content').innerHTML = sanitizedContent;
  } catch (error) {
    console.error('Error loading ENS content:', error);
    alert(`Error: ${error.message}`);
  }
}

async function fetchIPFSContent(cid) {
  console.log(`Fetching IPFS content for CID: ${cid}`);
  let content = '';
  for await (const chunk of ipfs.cat(cid)) {
    content += new TextDecoder().decode(chunk);
  }
  console.log('IPFS content fetched:', content);
  return content;
}

// Event listener for the load button
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event triggered.');
  document.getElementById('loadButton').addEventListener('click', () => {
    console.log('Load button clicked.');
    const ensInput = document.getElementById('ensInput').value.trim();
    console.log('ENS input:', ensInput);
    if (ensInput.endsWith('.eth')) {
      loadENSContent(ensInput);
    } else {
      console.log('Invalid ENS domain entered.');
      alert('Please enter a valid .eth domain');
    }
  });
});
