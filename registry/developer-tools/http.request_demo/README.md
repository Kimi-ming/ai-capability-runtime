# http.request_demo

Demonstrate the simplest OpenCap HTTP Capability.

## Risk

`read_only`

This demo performs a GET request to a user-provided URL. A production runtime
should still apply outbound network policy.

## Example Input

```json
{
  "url": "https://example.com"
}
```
