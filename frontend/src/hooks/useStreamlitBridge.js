import { useState, useEffect, useCallback, useRef } from 'react';
import { Streamlit } from 'streamlit-component-lib';

export function useStreamlitBridge() {
  const [serverPayload, setServerPayload] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const sessionTokenRef = useRef(null);

  useEffect(() => {
    const onRender = (event) => {
      const args = event.detail?.args;
      if (args && args.payload) {
        setServerPayload(args.payload);
        sessionTokenRef.current = args.payload?.auth_state?.session_token || null;
        if (args.payload.action_response) {
          setLastResponse(args.payload.action_response);
          setIsSubmitting(false);
        }
      }
      Streamlit.setFrameHeight(Math.max(document.body.scrollHeight, 840));
    };

    Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender);
    Streamlit.setComponentReady();
    Streamlit.setFrameHeight(880);

    const resizeObserver = new ResizeObserver(() => {
      Streamlit.setFrameHeight(Math.max(document.body.scrollHeight, 840));
    });
    resizeObserver.observe(document.body);

    return () => {
      Streamlit.events.removeEventListener(Streamlit.RENDER_EVENT, onRender);
      resizeObserver.disconnect();
    };
  }, []);

  const sendAction = useCallback((action, payload = {}) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setIsSubmitting(true);
    Streamlit.setComponentValue({
      request_id: requestId,
      action,
      session_token: sessionTokenRef.current,
      payload,
    });
    return requestId;
  }, []);

  const clearResponse = useCallback(() => {
    setLastResponse(null);
  }, []);

  return {
    serverPayload,
    sendAction,
    isSubmitting,
    lastResponse,
    clearResponse,
  };
}
