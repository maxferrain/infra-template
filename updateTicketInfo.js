const fetch = require("node-fetch")
const exec = require('@actions/exec')
const github = require('@actions/github')
require("dotenv").config()

const {OAUTH, ORG_ID, ISSUE_ID, HOST} = process.env

const headers = {
    Authorization: `OAuth ${OAUTH}`,
    "X-Org-ID": ORG_ID,
}

const execute = async (command, args) => {
    let output = ""
    let error = ""

    const options = {}
    options.listeners = {
        stdout: (data) => {
            output += data.toString();
        },
        stderr: (data) => {
            error += data.toString();
        }
    };

    await exec.exec(command, args, options)

    if (error) {
        throw new Error(`Unable to execute ${command}`)
    }
    return output
}


const getTags = async () => {
    return (await execute('git', ['tag'])).split("\n")
        .filter(Boolean)
        .sort((a, b) => {
            const aVal = parseInt(a.replace("rc-0.0.", ""), 10);
            const bVal = parseInt(b.replace("rc-0.0.", ""), 10);
            return aVal - bVal;
        });
}

const getCommitsInfo = async (tag) => {
    const tags = await getTags()
    const currentIndex = tags.indexOf(tag)
    const commitsFilter = tags.length === 1 ? tag : `${tags[currentIndex - 1]}...${tag}`;
    const releaseCommits = await execute('git', ['log', '--pretty=format:"%H %an %s"', commitsFilter]);
    return releaseCommits.replace(/"/g, "");
}


const updateTicketInfo = async () => {
    const currentTag = github.context.payload.ref.replace("refs/tags/", "") ?? ""
    console.log(`currentTag ${currentTag}`)
    const commits = await getCommitsInfo(currentTag)

    const pusher = github.context.payload.pusher?.name ?? ""
    console.log(`Pusher ${pusher}`)
    const date = new Date().toLocaleDateString()
    console.log(`Date ${date}`)

    const summary = `Релиз №${currentTag.replace("rc-", "")} от ${date}`;
    const description = `Ответственный за релиз: ${pusher}\n---\nКоммиты, попавшие в релиз:\n${commits}`;


    console.log(summary)
    console.log(description)

    console.log(`${HOST}/v2/issues/${ISSUE_ID}`, OAUTH, ORG_ID)

    await fetch(`${HOST}/v2/issues/${ISSUE_ID}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
            summary,
            description
        })
    })
}


updateTicketInfo()
    .then(() => console.log('Successful updating'))
    .catch(() => console.log('Error occurred'))
