workspace "filiphagen.com" "Personal portfolio site with an LLM-backed chatbot" {

    model {
        visitor = person "Anonymous visitor" "Recruiter or curious reader. Never authenticates."
        filip = person "Filip (maintainer)" "Sole developer and operator."

        anthropic = softwareSystem "Anthropic Messages API" "Generates chatbot replies. Metered, billed per token." "External"
        atlas = softwareSystem "MongoDB Atlas" "Managed Mongo free tier." "External"

        site = softwareSystem "filiphagen.com" "Portfolio site with a chatbot that answers questions about Filip." {
            spa = container "Portfolio SPA" "All portfolio content with no backend dependency; hosts the chat UI." "React 18 + TypeScript + MUI, built with Vite, static on CDN" "Web Browser"
            api = container "Chat API" "Applies the abuse guard before any billable call, then relays to Anthropic and persists the transcript." "Node 18 + Express 5 on Render"
            store = container "Chat transcripts" "Anonymous transcripts, expiring after 30 days via TTL index." "MongoDB Atlas" "Database"
        }

        visitor -> spa "Reads the portfolio and chats" "HTTPS"
        filip -> site "Maintains"
        spa -> api "Sends chat messages (chat route only)" "HTTPS/JSON"
        api -> anthropic "Requests a reply, after the guard passes" "HTTPS via Anthropic SDK"
        api -> store "Reads and writes transcripts" "Mongoose/TLS"
        store -> atlas "Hosted on"
    }

    views {
        systemContext site "Context" {
            include *
            autolayout lr
        }

        container site "Containers" {
            include *
            autolayout lr
        }

        styles {
            element "Person" {
                shape person
                background #1168bd
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Database" {
                shape cylinder
            }
            element "Web Browser" {
                shape webBrowser
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
        }
    }
}
