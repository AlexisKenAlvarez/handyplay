import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "regenerator-runtime/runtime";
import { cn } from "./utils/utils";

const App = () => {
  const [seekTime, handleSeekTime] = useState<number>(5);
  const [listening, setListening] = useState(false);
  const [hidden, setHidden] = useState(false);

  const commands = [
    {
      command: ["pause", "tigil", "post", "stop"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        handlePlayback("pause"), resetTranscript();
      },
    },
    {
      command: ["play", "tuloy"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        handlePlayback("play"), resetTranscript();
      },
    },
    {
      command: ["skip"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        console.log("Inside skip");
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
      command: ["next"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        console.log("Next slide");
        handlePage("next"), resetTranscript();
      },
    },
    {
      command: ["back"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        console.log("Previous slide");
        handlePage("back"), resetTranscript();
      },
    },
    {
      command: ["hide"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        console.log("Previous slide");
        setHidden(true), resetTranscript();
      },
    },
    {
      command: ["show"],
      callback: ({ resetTranscript }: { resetTranscript: () => void }) => {
        console.log("Previous slide");
        setHidden(false), resetTranscript();
      },
    },
  ];

  const {
    transcript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript
  } = useSpeechRecognition({ clearTranscriptOnListen: true, commands });

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

  const handlePage = async (type: string) => {
    let [tab] = await chrome.tabs.query({ active: true });
    console.log(tab);
    chrome.scripting.executeScript({
      target: { tabId: tab.id!, allFrames: true },
      world: "MAIN",

      func: (type: string) => {
        var simulateMouseEvent = function (
          element: any,
          eventName: any,
          coordX: any,
          coordY: any
        ) {
          element.dispatchEvent(
            new MouseEvent(eventName, {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: coordX,
              clientY: coordY,
              button: 0,
            })
          );
        };

        if (type === "next") {
          let elementToClick = document.querySelectorAll("div[role=button]")[1];
          console.log(document.querySelectorAll("div[role=button]"));

          // Check if the element has an onclick attribute
          var box = elementToClick.getBoundingClientRect(),
            coordX = box.left + (box.right - box.left) / 2,
            coordY = box.top + (box.bottom - box.top) / 2;

          simulateMouseEvent(elementToClick, "mousedown", coordX, coordY);
          simulateMouseEvent(elementToClick, "mouseup", coordX, coordY);
          simulateMouseEvent(elementToClick, "click", coordX, coordY);
        } else {
          let elementToClick = document.querySelectorAll("div[role=button]")[0];

          // Check if the element has an onclick attribute
          var box = elementToClick.getBoundingClientRect(),
            coordX = box.left + (box.right - box.left) / 2,
            coordY = box.top + (box.bottom - box.top) / 2;

          simulateMouseEvent(elementToClick, "mousedown", coordX, coordY);
          simulateMouseEvent(elementToClick, "mouseup", coordX, coordY);
          simulateMouseEvent(elementToClick, "click", coordX, coordY);
        }
      },
      args: [type],
    });
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
  useEffect(() => {
    const interval = setInterval(() => {
      resetTranscript()
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [transcript]);

  return (
    <div
      className={cn(
        "w-[20rem] h-[25rem] bg-black p-10 opacity-100 transition-all ease-in-out duration-300 max-h-full overflow-hidden",
        {
          "opacity-0 max-h-0 p-0": hidden,
        }
      )}
    >
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
            className="punch"
            type="range"
            min={1}
            max={10}
            defaultValue={seekTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseInt(e.target.value);

              handleSeekTime(value);
            }}
          />
          <h2 className="text-white text-center ">Seek Time: {seekTime}</h2>
        </div>
      </div>
    </div>
  );
};

export default App;
