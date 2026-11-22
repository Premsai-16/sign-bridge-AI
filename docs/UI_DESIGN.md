# SignBridge interface

The interface centers everyday communication, rather than presenting the product as six competing divisions. Conversation, learning, and communication boards are the primary homepage choices. Owner training remains separate and accessible from navigation. History and settings remain available in the footer.

Shared tokens live in frontend/src/styles/index.css. Cobalt is the primary action color, mint supports learning, and coral distinguishes assistance. Outfit headings pair with Inter body text, with system fallbacks. Light and dark palettes are explicitly defined. Avoid reintroducing competing palette overrides.

The homepage greeting preview uses the existing speech service and bundled greeting audio; it is explicitly an example, not simulated live recognition. Playback stops on language changes and when leaving the page. Motion is restricted to short transitions and the waveform during playback, with a global reduced-motion fallback.

Design research: UI/UX Pro Max guidance for accessible communication, and 21st.dev's Bento Card by 0xUrvish (https://21st.dev/@0xUrvish/components/bento-card). The interactive preview and feature layout are custom implementations using the project's existing React and Lucide dependencies; no external component runtime was added.

Validation: production build, existing speech/translation regression suite, browser checks at 1440px and 375px, light/dark rendering, language selection/playback completion, mobile menu and studio navigation. Hardware camera accuracy and live custom-word translation are outside this visual redesign verification.
