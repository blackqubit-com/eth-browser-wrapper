import { BrowserProvider, getDefaultProvider } from 'ethers';
import DOMPurify from 'dompurify';
import { CID } from 'multiformats/cid';
import PeerId from 'peer-id';
import { bases } from 'multiformats/basics';
import codecs from './codecs.json';

// Initialize Ethereum provider
const provider = window.ethereum
  ? new BrowserProvider(window.ethereum)
  : getDefaultProvider('mainnet');

const basesByPrefix = Object.fromEntries(
  Object.keys(bases).map(key => [bases[key].prefix, bases[key]])
);

/**
 * Decode CID from string value.
 * @param {string} value - The CID value.
 * @returns {object} Decoded CID object.
 */
function decodeCID(value) {
  const prefix = value[0];
  const base = basesByPrefix[prefix];
  const cid = CID.parse(value, base);

  return {
    cid,
    multibase: cid.version === 0 ? bases.base58btc : base,
    multicodec: codecs[cid.code],
    multihash: {
      ...cid.multihash,
      name: codecs[cid.multihash.code].name,
    },
  };
}

/**
 * Convert Peer ID to CIDv1.
 * @param {string} value - Peer ID in Base58 format.
 * @returns {string} CIDv1 in Base32 format.
 */
function getCIDfromPeerId(value) {
  try {
    const peerId = PeerId.createFromB58String(value);
    const { cid } = decodeCID(peerId.toString());
    return cid.toV1().toString(bases.base32);
  } catch (error) {
    console.error('Error converting Peer ID to CIDv1:', error);
    throw error;
  }
}

/**
 * Load and display content based on ENS name.
 * @param {string} ensName - ENS name (e.g., 'example.eth').
 */
async function loadENSContent(ensName) {
  console.log(`Loading content for ENS: ${ensName}`);

  try {
    if (window.ethereum) {
      console.log('Requesting account access...');
      await provider.send('eth_requestAccounts', []);
    }

    const resolver = await provider.getResolver(ensName);
    if (!resolver) throw new Error('Resolver not found for ENS name');
    const contentHashRaw = await resolver.getContentHash();
    if (!contentHashRaw) throw new Error('Content hash not set for ENS name');

    let fetchPath;
    if (contentHashRaw.startsWith('ipns://')) {
      const peerId = contentHashRaw.replace('ipns://', '');
      const cid = getCIDfromPeerId(peerId);
      fetchPath = `https://ipfs.io/ipns/${cid}`;
    } else if (contentHashRaw.startsWith('0x')) {
      throw new Error('Content hash is in hexadecimal but is expected to be a Peer ID.');
    } else {
      throw new Error('Unsupported content hash format for Peer ID handling.');
    }

    const cachedContent = sessionStorage.getItem(ensName);
    if (cachedContent) {
      console.log('Using cached content.');
      document.getElementById('content').innerHTML = cachedContent;
      return;
    }

    console.log(`Fetching content from IPNS gateway at: ${fetchPath}`);
    const response = await fetch(fetchPath);
    if (!response.ok) throw new Error(`Failed to fetch content. Status: ${response.status}`);
    const content = await response.text();

    console.log('Sanitizing and displaying content...');
    const sanitizedContent = DOMPurify.sanitize(content);
    sessionStorage.setItem(ensName, sanitizedContent);
    document.getElementById('content').innerHTML = sanitizedContent;
  } catch (error) {
    console.error('Error loading ENS content:', error.message);
    alert(`Error: ${error.message}`);
  }
}

/**
 * Event listener for the load button.
 * Triggers loading content based on the ENS input.
 */
document.addEventListener('DOMContentLoaded', () => {
  const loadButton = document.getElementById('loadButton');
  if (loadButton) {
    loadButton.addEventListener('click', () => {
      const ensInput = document.getElementById('ensInput').value.trim();
      if (ensInput.endsWith('.eth')) {
        loadENSContent(ensInput);
      } else {
        alert('Please enter a valid .eth domain');
      }
    });
  } else {
    console.error('Load button not found in the DOM.');
  }
});
