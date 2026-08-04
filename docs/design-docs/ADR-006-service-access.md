# ADR-006: tRPC, REST, and Axios responsibilities

Status: accepted

tRPC is preferred for Palea client-to-backend operations. REST remains for health,
webhooks, and open interoperability. Axios implements a generic REST client and is
never used as tRPC's transport.
