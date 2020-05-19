/**
 * Needs a doc string.
 */
import React, { useState, useEffect, useRef } from "react";
import Sockette from "sockette";
import Link from "next/link";

import "./spy.module.css";

export default function DocumentSpy({ onMessage }) {
  // null - never connected before
  // true - connected
  // false - no longer connected
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [websocketError, setWebsocketError] = useState<any>(null);

  const wssRef = useRef<Sockette>();
  useEffect(() => {
    let mounted = true;
    wssRef.current = new Sockette("ws://localhost:8080", {
      timeout: 5e3,
      maxAttempts: 25,
      onopen: (e) => {
        if (mounted) setConnected(true);
      },
      onmessage: (e) => {
        const data = JSON.parse(e.data);
        onMessage(data);
        if (mounted) setLastMessage(data);
      },
      onreconnect: (e) => {},
      onmaximum: (e) => {},
      onclose: (e) => {
        if (mounted) setConnected(false);
      },
      onerror: (e) => {
        if (mounted) setWebsocketError(e);
      },
    });
    return () => {
      mounted = false;
      wssRef.current && wssRef.current.close();
    };
  }, [onMessage]);

  if (connected === null) {
    return null;
  }

  return (
    <div
      id="document-spy"
      className={connected ? "ws-connected" : "ws-not-connected"}
    >
      {websocketError ? (
        <span title={websocketError.toString()}>WebSocket error!</span>
      ) : (
        <span>
          Document Spy {connected ? "connected 👀" : "not connected 👎🏽"}
        </span>
      )}{" "}
      {lastMessage && <ShowLastMessage {...lastMessage} />}
    </div>
  );
}

function ShowLastMessage({ hasEDITOR, documentUri, changedFile }: any) {
  function clickToOpenHandler(event) {
    event.preventDefault();
    console.log(`Going to try to open ${changedFile.path} in your editor`);
    fetch(`/_open?filepath=${changedFile.path}`);
  }
  return (
    <span>
      Last changed URL <Link href={documentUri}>{documentUri}</Link>{" "}
      {hasEDITOR && (
        <Link href={documentUri}>
          <a onClick={clickToOpenHandler}>
            <b>Open in your editor</b>
          </a>
        </Link>
      )}
    </span>
  );
}
