import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "regenerator-runtime/runtime";

import axios from "axios";

const App = () => {
  const [seekTime, handleSeekTime] = useState<number>(5);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.post(
          "https://thesis-server.vercel.app/api/v1/getPage",
          {
            presentationId: "1vda8wfRwSpOqSKgkzHc6qaPJTFVYBmVkSh1FefIerPs",
          }
        );

        const data = res.data;
        console.log(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData(); // Call the async function here
  }, []);

  const commands = [
    {
      command: ["pause", "tigil", "post", "stop"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        handlePlayback("pause"), resetTranscript();
      },
    },
    {
      command: ["play", "tuloy", "post"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        handlePlayback("play"), resetTranscript();
      },
    },
    {
      command: ["skip"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        handleSeek("forward"), resetTranscript();
      },
    },
    {
      command: ["rewind"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        handleSeek("backward"), resetTranscript();
      },
    },
    {
      command: ["go"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        handleNext(), resetTranscript();
      },
    },
  ];

  const {
    transcript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({ commands });

  console.log(transcript);

  const handlePlayback = async (type: string) => {
    let [tab] = await chrome.tabs.query({ active: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      world: "MAIN",
      func: (type) => {
        const videoElem = document.querySelector("video");

        if (videoElem && videoElem instanceof HTMLVideoElement) {
          if (!videoElem.paused && type === "pause") {
            videoElem.pause();
          } else {
            videoElem.play();
          }
        }
      },
      args: [type],
    });
  };

  const handleSeek = async (type: string) => {
    let [tab] = await chrome.tabs.query({ active: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      world: "MAIN",
      func: (seekTime: number, type: string) => {
        const videoElem = document.querySelector("video");

        if (videoElem && videoElem instanceof HTMLVideoElement) {
          if (type === "backward") {
            videoElem.currentTime -= seekTime;
          } else {
            videoElem.currentTime += seekTime;
          }
        }
      },
      args: [seekTime, type],
    });
  };

  const handleNext = () => {
    console.log("GO NEXT");
    const myurl =
      "https://docs.google.com/presentation/d/1vda8wfRwSpOqSKgkzHc6qaPJTFVYBmVkSh1FefIerPs/edit#slide=id.g291e2a3783e_0_0";
    chrome.tabs.update({ url: myurl });
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="w-[20rem] h-[25rem] bg-black p-10 grid place-content-center text-center text-white">
        <span>Browser doesn't support speech recognition.</span>;
      </div>
    );
  }

  if (!isMicrophoneAvailable) {
    return (
      <div className="w-[20rem] h-[25rem] bg-black p-10 grid place-content-center text-center text-white">
        <span>
          Please allow us to use your microphone to access our full feature.
        </span>
        ;
      </div>
    );
  }

  return (
    <div className="w-[20rem] h-[25rem] bg-black p-10">
      <h1 className="text-white text-2xl text-center">
        {listening ? "Now listening" : "Not listening"}
      </h1>

      <h1 className="text-white">{transcript}</h1>

      <div className=" w-fit mx-auto mt-10 flex flex-col gap-5">
        <button
          className="bg-white px-5 py-2"
          onClick={async () => {
            await navigator.mediaDevices
              .getUserMedia({ audio: true, video: false })
              .then(function () {
                setListening(true);
                SpeechRecognition.startListening({ continuous: true });
              })
              .catch(function (error) {
                window.chrome.tabs.create({
                  url: "request-mic.html",
                });
                console.log(error);
              });
          }}
        >
          Start Mic
        </button>
        <button
          className="bg-white px-5 py-2"
          onClick={() => {
            setListening(false);
            SpeechRecognition.abortListening();
          }}
        >
          Stop Mic
        </button>

        <div className="">
          <input
            type="range"
            min={1}
            max={10}
            defaultValue={seekTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseInt(e.target.value);

              handleSeekTime(value);
            }}
          />
          <h2 className="text-white text-center">Seek Time: {seekTime}</h2>
        </div>
      </div>
    </div>
  );
};

export default App;
