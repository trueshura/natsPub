'use strict';
const readline = require('readline');
const NATS = require('tasu');
const commandLineArgs = require('command-line-args');

// Опции командной строки
const parsedArgs = initCmdlineParams();
const nats = initNATS(parsedArgs);

;(async () => {
    await nats.connected();

    const data = JSON.parse(await readJSONFromStdIn());
    console.log(data);
    if (parsedArgs.request) {
        const resp = await nats.request(parsedArgs.topic, data);
        console.dir(resp, {colors: true, depth: null});
    } else {
        nats.publish(parsedArgs.topic, data);
    }
})()
        .then(() => {
            process.exit(0);
        })
        .catch(err => {
            console.error(err);
            process.exit(1);
        });

/**
 *
 * @return {Promise<any>}
 */
function readJSONFromStdIn() {
    const inputChunks = [];
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on('line', function (chunk) {
            inputChunks.push(chunk);
        });

        rl.on('close', function () {
            resolve(inputChunks.join(''));
        });
    });
}

function initCmdlineParams() {
    const optionDefinitions = [
        {name: 'topic', type: String, multiple: false},
        {name: 'request', type: String, multiple: false},
        {name: 'url', type: String, multiple: false},
        {name: 'user', type: String, multiple: false},
        {name: 'pass', type: String, multiple: false}
    ];
    const parsedArgs = commandLineArgs(optionDefinitions);
    parsedArgs.request = parsedArgs.request || true;

    if (!parsedArgs.topic) throw new Error('Укажите NATS topic в командной строке: --topic тут_топик');

    return parsedArgs;
}

function initNATS(cmdLineOptions) {
    // NATS
    const natsOptions = {
        maxReconnectAttempts: -1,
        reconnectTimeWait: 250,
        url: 'nats://localhost:4222'
    };

    return new NATS({
        ...natsOptions,
        ...cmdLineOptions
    })
}