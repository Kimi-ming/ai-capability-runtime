# slack.send_message

`slack.send_message` sends a message to a Slack channel through Slack Web API `chat.postMessage`.

## What It Does

This Capability sends user-provided text to one Slack channel. It can optionally send the message as a reply in an existing thread.

It is an `external_send` Capability because it sends content outside the local OpenCap boundary. V1 policy should normally require human confirmation before execution.

## Input

| Field | Required | Description |
| --- | --- | --- |
| `channel_id` | yes | Slack channel id such as `C0123456789`. |
| `text` | yes | Message text to send. |
| `thread_ts` | no | Slack thread timestamp for replies. |

## Output

| Field | Description |
| --- | --- |
| `ok` | Slack API success flag. |
| `channel` | Slack channel id returned by the API. |
| `ts` | Message timestamp returned by the API. |

## Auth

Set a Slack bot token in the environment before real execution:

```bash
export SLACK_BOT_TOKEN=xoxb-your-token
```

Do not put real Slack tokens in `manifest.yml`, test fixtures, README examples, issue templates, or tool input. The token should be provided only through the configured env var.

Required Slack scope:

```text
chat:write
```

## Permissions and Risk

```yaml
permissions:
  - resource: slack.message
    action: send
    risk: external_send
    confirmation: ask
```

This Capability should not be default-allowed for untrusted AI calls because it can send text to people or teams outside OpenCap.

## Dry Run

```bash
opencap install slack.send_message
opencap invoke slack.send_message --dry-run --input-json '{"channel_id":"C0123456789","text":"OpenCap smoke test message"}'
```

The registry test uses fake input and does not require a real Slack token.
