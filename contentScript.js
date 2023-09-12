function storeVariableInChromeStorage(variableName, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({ [variableName]: value }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(`Stored ${variableName}`);
            }
        });
    });
}


function getVariableFromChromeStorage(variableName) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(variableName, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[variableName]);
            }
        });
    });
}


function createDefault() {
    createList("lastLoadedList");
    createList("lastLoadedListTitle");
    createList("fetchFromStorage2");
    createList("asd");
}

function isBottomReached() {
    // Calculate how far the user has scrolled down
    const scrollY = window.scrollY;
    // Calculate the height of the entire page
    const pageHeight = document.documentElement.scrollHeight;
    // Calculate the height of the visible viewport
    const viewportHeight = window.innerHeight;

    // Check if the user has scrolled close to the bottom
    return scrollY + viewportHeight >= pageHeight - pageHeight * .5; // Adjust the threshold as needed
}

function getItemsfromDOM() {
    return new Promise((resolve, reject) => {
        // Perform asynchronous operations like DOM querying here
        const gridArray = document.getElementsByClassName("ytd-rich-item-renderer");
        const titleArray = Array.from(gridArray).map(ele => {
            const titleLink = ele.querySelector("a#video-title-link");
            return [ele, titleLink];
        });
        resolve(titleArray); // Resolve the promise with the result
    });
}


async function removeEle(titleArray) {
    let resultObj
    try {
        resultObj = await getObjFromLastLoadedKey();
        // console.log(resultObj); // Do something with the object

    } catch (error) {
        console.error(error);
    }

    for (let i = 0; i < titleArray.length; i++) {
        let ele = titleArray[i][0];
        let titleLink = titleArray[i][1];
        if (titleLink) {
            let title = titleArray[i][1].getAttribute("title").toLowerCase();
            if (shouldRemoveTitle(title, resultObj)) {
                ele.classList.add('hidden');
            }

        }
    }
}


async function getObjFromLastLoadedKey() {
    const result = await getVariableFromChromeStorage("lastLoadedList");
    if (result) {
        const obj = await getVariableFromChromeStorage(result);
        return obj;
    }
}


function shouldRemoveTitle(title, filterWords) {
    if (!title || !filterWords) {
        return false; // Return false if title or filterWords is null or undefined
    }

    const lowerCaseTitle = title.toLowerCase();

    // Convert filter words to lowercase
    const lowerCaseFilterWords = Object.keys(filterWords).map(word => word.toLowerCase());

    return lowerCaseFilterWords.some(word => lowerCaseTitle.includes(word));
}


async function removeEleBundle() {
    // console.log("removeEleBundle is running")
    if (getWindowURL() === "https://www.youtube.com/" || getWindowURL().includes("youtube.com/?bp=")) {
        const titleArray = await getItemsfromDOM();
        removeEle(titleArray);
        console.log("remove")
    }

}

function getWindowURL() {
    return window.location.href
}


function handleMessage(message, sender, sendResponse) {
    const { value, action, listName } = message;
    // console.log(message, sender, sendResponse)
    switch (action) {
        case "testButton":
            getVariableFromChromeStorage("lastLoadedList").then(e => console.log(e))
            return true;  // Keeps the message channel open for asynchronous response
            break;
        default:
            console.log("Default case reached: no condition is met");
            sendResponse({ status: "no condition is met" });
            removeEleBundle()
            break
    }
}




function throttle(func, limit) {
    let inThrottle;
    return function () {
        const context = this, args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function checkIfBottomReachedAndExecuteScroll() {
    if (isBottomReached()) {
        removeEleBundle();
    }
}




function CheckIfBottomReachedAndExecuteKey(event) {
    // Check if the key pressed is the down arrow (key code 40), End key (key code 35), or Page Down key (key code 34)
    if ((event.keyCode === 40 || event.keyCode === 35 || event.keyCode === 34) &&
        isBottomReached()) {
        removeEleBundle();
    }
}


var throttledCheckIfBottomReachedAndExecuteScroll = throttle(checkIfBottomReachedAndExecuteScroll, 500);
var throttledCheckIfBottomReachedAndExecuteKey = throttle(CheckIfBottomReachedAndExecuteKey, 500);

(() => {
    getVariableFromChromeStorage("lastLoadedList")
        .then(value => {
            if (value === undefined) {
                createDefault()
                console.log("The variable does not exist in storage.");
            } else {
                console.log("The variable exists, and its value is:", value);
            }
        })
        .catch(error => {
            console.error("An error occurred:", error);
        });

    chrome.runtime.onMessage.addListener(handleMessage);

    // Event Listeners
    window.addEventListener('scroll', throttledCheckIfBottomReachedAndExecuteScroll);
    window.addEventListener('keydown', throttledCheckIfBottomReachedAndExecuteKey);

    // Timeout to remove elements
    let count = 0;
    const intervalId = setInterval(() => {
        removeEleBundle();
        count++;
        if (count >= 20) {
            clearInterval(intervalId);
        }
    }, 250);

})()







