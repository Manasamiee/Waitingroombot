import React from 'react';
import "./App.css";
import { useState, useEffect, useRef } from "react";
import Message from "./components/Message/Message.js";
import StatusIndicator from "./components/StatusIndicator/StatusIndicator.js";
import SummariserButton from "./components/SummariserButton/SummariserButton.js";
import NextButton from "./components/NextButton/NextButton.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { topics } from "./prompts/topicPrompts.js";
import { guides } from "./guides/guides.js";
import StepIndicator from './components/StepIndicator/StepIndicator.js'; // Adjust the path as necessary


const API_KEY = process.env.REACT_APP_API_KEY;
const API_keyy = process.env.REACT_APP_API_keyy;

// const systemMessage = {
//   role: "system",
//   content:
//     "You are a waiting room chatbot, designed to prepare patients to be better informed by discussing their condition. You want to extract as much relevant information as possible by asking questions that engage the patient. You do this by making patients reflect upon their health situation by indirectly targeting three specific topics in (()) that are described in the following {{}}: {{((Remembering pain episodes)): Prompt the patient to provide reflections about kind of pain, specific location of the pain, and significant pain episodes: Encourage the patient to explain why this is the case: Ensure the patient do describe duration and frequency of their pain. ((Articulating pain episodes)): Prompt participants to describe the type, intensity, and duration of the pain: Encourage the patient to describe their pain in their own words: Ensure the patient is provided support in formulating their pain. ((Awareness of treatment options)): Prompt the patient to describe their awareness of available treatment options for their condition: Encourage the patient to ask questions about available treatment options for their condition: Ensure the patient is provided with the treatment options related to their condition.}}You MUST ENSURE to use these three topics as guiding principles for your conversation. You MUST ENSURE you elicit deep self-reflection from the user for each of these topics and completely elaborate before changing the topic. YOU MUST AVOID asking multiple questions in a row. YOU MUST focus on only one kind of pain that the patient mentioned even if the patient insists on changing the subject. During the interaction, you must create a positive and supportive environment. The conversation must be enjoyable for the patient. Your responses are limited to between 20 to 30 words. Although the patient has responded to the topics described in {{(())}}, you keep encouraging and pushing the patient to provide additional information on their health condition. When signs of conversation conclusion are detected, gently ask the user if is ready to wrap up our conversation.",
// };

const summarySystemMessage = {
  role: "system",
  content:
    "Summarize this conversation into four categories: Facts (symptoms, medical history, current condition), Feelings (emotions and feelings), Fears (fears, concerns, and functioning in daily life), and Future (expectations, hopes, and concerns for the future). Your response HAS to include each of the four titles: Facts, Feelings, Fears, and Future. For each title, provide a very short summary up to three words. You always end each category with a punctuation mark. If there is no relevant user response for any particular category, you write “N/A.”. Here is an example of the expected output: Facts: Back pain for two weeks, pain is constant. Feelings: Feels incapable. Fears: Won't recover, ability to work is affected. Future: Prefers surgery, and seeks full pain relief.",
};

const initialMessage = {
  message: ("Hi there! I'm an AI chatbot created to help you get ready for your doctor's appointment. My specialties include:1- Helping you accurately recall and track pain episodes. 2- Assist in clearly articulating your pain for a better diagnosis.3- Informing you about various treatment options.Which of these three should we start with to feel more prepared for your upcoming doctor's visit?"
  ),
  sentTime: "just now",
  sender: "ChatGPT",
};

const pre_messages = [
  "Next, can you try describing how do you feel about your pain?",
  "Please describe what fears or concerns you can relate to your pain.",
  "Lastly, please describe your ideas for treatment and any particular outcomes you hope to achieve. When you are finished, click the 'Summarise' button when you are ready to wrap up the conversation."
]



const useDummyData = false;

function App() {
  const [messages, setMessages] = useState([initialMessage]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Added inputRef
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);
  const [separatorIndices, setSeparatorIndices] = useState([]);


  const ThankYouModal = () => (
    <div className="thank-you-modal">
      <div className="modal-content">
        <h2>Thank You!</h2>
        <p>Your chat summary has been submitted.</p>
        <p>Now you are ready for your doctor's appointment.</p>
        <button className="Finish" onClick={() => setShowThankYouModal(false)}>Finish</button>
      </div>
    </div>
  );

  useEffect(() => {
    scrollToBottom();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  const sendMessage = async () => {
    const message = inputRef.current.value;
    if (!message.trim()) {
      return; // Don't send empty messages
    }
    const newMessage = {
      message,
      direction: "outgoing",
      sender: "user",
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsTyping(true);
    inputRef.current.value = "";
    await processMessageToChatGPT(newMessages);
  };

  const nextGuide = () => {
    let currentGuideIndex = guideIndex;
    let currentMessages = messages

    if (currentGuideIndex < 3) { // Assuming there are 3 guides
      // Update separator indices to include the new position and the current guide index
      const newSeparatorIndices = [...separatorIndices, { index: messages.length - 1, phase: currentGuideIndex + 1 }];
      setSeparatorIndices(newSeparatorIndices);

      currentMessages = currentMessages.slice(0, -1);      

      currentMessages.push(
        {
          message: pre_messages[guideIndex],
          sender: "ChatGPT",
        }
      )

      //console.log(currentMessages)

      setMessages(currentMessages)

      // Move to the next guide
      setGuideIndex(currentGuideIndex + 1);
    } else {
      console.log("Reached the end of the guides.");
    }
  };




  const handleEnter = async (e) => {

    if (e.key === "Enter") {
      sendMessage();
    }

  }

  useEffect(() => {
    // console.log(`old: `, messages)
    //let newMessages = messages //.slice(0, -1);
    // console.log(`new: `, newMessages)
    //setMessages(newMessages)
    //processMessageToChatGPT(newMessages)
  }, [guideIndex])

  const processMessageToChatGPT = async (chatMessages) => {
    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message };
    });

    let newSystemMessage = {
      role: "system",
      content: topics[guideIndex]
    };

    const apiRequestBody = {
      model: "gpt-4",
      messages: [newSystemMessage, ...apiMessages],
      temperature: 0.2,

    };

    //console.log(apiRequestBody)

    if (useDummyData) {
      setMessages([
        ...chatMessages,
        {
          message:
            "This is just a dummy message for testing the interface without using chatgpt",
          sender: "ChatGPT",
        },
      ]);
    } else {
      await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiRequestBody),
      })
        .then((data) => {
          return data.json();
        })
        .then((data) => {
          // console.log(data);
          setMessages([
            ...chatMessages,
            {
              message: data.choices[0].message.content,
              sender: "ChatGPT",
            },
          ]);
          setIsTyping(false);
        });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  

  const summarise = async () => {
    setIsLoading(true); // Start loading before API call

    // Check if there are more guides to display
    if (guideIndex < guides.length - 1) {
        setGuideIndex(guideIndex + 1); // Move to the next guide
    } else {
        // If no more guides, proceed with summarization
        // Extract only messages sent by the user
        let userMessages = messages
            .filter((messageObject) => messageObject.sender === 'user')
            .map((messageObject) => ({ role: 'user', content: messageObject.message }));

        const apiRequestBody = {
            model: "gpt-4",
            messages: [
                summarySystemMessage, // System message providing instructions for the AI
                ...userMessages // Only include user messages here
            ],
            temperature: 0,
        };

        //console.log('API request body:', (apiRequestBody));

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + API_keyy,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(apiRequestBody),
            });

            if (!response.ok) {
                const errorBody = await response.text(); // Convert response body to text for more detail
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }

            const data = await response.json();
            console.log(data);

            // Update the summary text with the content from the first choice
            setSummaryText(data.choices[0].message.content);
            setShowSummary(true); // Show the summary part
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false); // Stop loading whether there is an error or not
        }
    }
};





  const Loader = () => (
    <div className="loader">
      <img src="/pngwing.com.png" alt="Loading..." />
    </div>
  );

  const SummaryModal = ({ }) => {
    const handleSubmit = () => {
      setShowSummary(false);
      setShowThankYouModal(true);
    };
    //console.log(summaryText)
    return (
      <div className="summary-wrapper">
        <div className="summary-modal">
          <div className="modal-text">
            <ul>
              {summaryText && summaryText.split(".").slice(0, -1).map((bullet, index) => (
                <li key={index} style={{ paddingBottom: "8px" }}>
                  {bullet.trim()}
                </li>
              ))}
            </ul>
          </div>
          <div className="modal-button-wrapper">
            <button className="modal-edit-btn" onClick={() => setShowSummary(!showSummary)}>
              Return to Chat
            </button>
            <button className="modal-submit-btn" onClick={handleSubmit}>
              Submit Summary
            </button>
          </div>
        </div>
      </div>
    );

  };

  const InitialMessage = ({ }) => {
    return (
      <Message sender="ChatGPT">
        Hi! My task is to prepare you for your doctor visit. This will involve four phases. In each phase, take your time to answer the questions asked. When you feel you have nothing more to share, press Next Button. Let's start: Can you describe the pain you're experiencing?
</Message>
    )

  };

  return (
    <div className="app">
      {isLoading ? (
        <Loader />
      ) : (
        <>

          {showSummary && <SummaryModal />}
          {showThankYouModal && <ThankYouModal />}

          <div className="GuideList">
            <StepIndicator currentStep={guideIndex} totalSteps={guides.length} />
            <div className="all-guides">
              {guides.map((guide, index) => (
                <div
                  key={index}
                  className={`guide-item ${index === guideIndex ? 'current-guide' : ''}`}
                >
                  <div className="guide-title">{guide.title}</div> {/* This line is new */}
                  {index === guideIndex ? <div className="guide-description">{guide.description}</div> : null}
                </div>
              ))}
            </div>

            <div className="btn-wrapper">
              {guideIndex < 3 ? (
                // Show 'Next' button for the first three guides
                <NextButton action={nextGuide} />
              ) : (
                // Show 'Summarise' button for the fourth guide
                <SummariserButton action={summarise} />
              )}
            </div>
          </div>

          <div className="wrapper">
            <div className="message-list">
              <InitialMessage />

              {messages.slice(1).map((m, i) => (
                <React.Fragment key={i}>


                  {/* Render the message itself */}
                  {/* Check for and render a phase-ending separator */}
                  {separatorIndices.find(si => si.index === i + 1) && (
                    <div className="non-fading-separator">
                      <div className="separator-text">End of Phase {separatorIndices.find(si => si.index === i + 1).phase}</div>
                    </div>
                  )}
                  {/* Check for and conditionally render a separator before every GPT message */}
                  {m.sender === 'ChatGPT' && <div className="message-separator"></div>}
                  <Message sender={m.sender}>{m.message}</Message>
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="separator" />
            <div className="interaction-area">
              <div className="status">
                <StatusIndicator isActive={isTyping} />
              </div>
              <div className="input-wrapper">
                <input
                  ref={inputRef}
                  onKeyDown={(e, i) => {
                    if (e.key === "Enter") handleEnter(e);
                  }}
                />
              </div>
              <div className="submit-wrapper">
                <div className="SendIcon" onClick={sendMessage}>
                  <FontAwesomeIcon icon={faPaperPlane} />
                </div>

              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );

}

export default App;
