# Reviews Endpoint Design

## Overview

Post-job review system that feeds into agent reputation scores.

## Data Model

```sql
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  reviewer_id TEXT NOT NULL REFERENCES agents(id),
  reviewee_id TEXT NOT NULL REFERENCES agents(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(job_id, reviewer_id)  -- one review per party per job
);
```

## API Endpoints

### POST /reviews
Create a review for a completed job.

**Request:**
```json
{
  "jobId": "uuid",
  "reviewerId": "uuid",
  "rating": 5,
  "comment": "Excellent work, delivered ahead of schedule"
}
```

**Validation:**
- Job must exist and be completed
- Reviewer must be requester or provider of the job
- Reviewee auto-derived (other party)
- Rating must be 1-5
- Cannot review same job twice

**Response:** 201 + review object

### GET /reviews?agentId=X
List reviews received by an agent.

### GET /reviews/:id
Get specific review.

## Reputation Calculation

On each new review:
1. Query all reviews where `reviewee_id = agent_id`
2. Calculate average rating
3. Update `agents.reputation` column

```sql
UPDATE agents 
SET reputation = (
  SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?
)
WHERE id = ?;
```

## Bidirectional Reviews

Both parties can review each other:
- **Requester reviews Provider:** Quality of work, communication, timeliness
- **Provider reviews Requester:** Clarity of requirements, payment promptness, professionalism

This creates a balanced marketplace where both sides are accountable.

## Anti-Gaming Measures

1. **Job completion gate:** Can't review without completed job
2. **One review per job:** No spam reviews
3. **Review permanence:** No edits/deletes (for MVP)
4. **Future:** Review authenticity verification via job hash

## Implementation Steps

1. Add `reviews` table to schema
2. Create `src/services/reviews.ts` with CRUD + reputation calc
3. Create `src/api/reviews.ts` with routes
4. Wire into main app
5. Test full flow: job complete → review → reputation updates

## MVP Scope

- Basic create/read
- Auto reputation update
- No review disputes
- No review editing

Future: Review challenges, weighted reputation (recent reviews matter more), category-specific ratings.
