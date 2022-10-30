const fetch = require("node-fetch")
const exec = require('@actions/exec')
const github = require('@actions/github')
require("dotenv").config()

const {OAUTH, ORG_ID, ISSUE_ID, HOST} = process.env

const headers = {
    Authorization: `OAuth ${OAUTH}`,
    "X-Org-ID": ORG_ID,
}

const build = async () => {
    const currentTag = github.context.payload.ref.replace("refs/tags/", "") ?? ""
    console.log(`current tag -  ${currentTag}`)

    await exec.exec('docker', ['build', '-t', `app:${currentTag}`, '.'])
    console.info("Image build")

    await fetch(`${HOST}/v2/issues/${ISSUE_ID}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            text: `Собрали образ с тегом ${currentTag}`
        })
    })

    console.log("Comment log added")
}

build()
    .then(() => console.log("Success build image"))
    .catch((e) => console.log(e))
