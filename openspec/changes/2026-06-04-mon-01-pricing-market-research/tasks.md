# Tasks: MON-01 pricing market research

Research and documentation (this change):

- [x] 1.1 Competitor pricing desk research (10 products, GBP/EUR)
- [x] 1.2 Feature parity map (shipped + backlog vs incumbents)
- [x] 1.3 Tier recommendation (Season / Annual / Monthly)
- [x] 1.4 OpenSpec spec `product-monetization`
- [x] 1.5 Investor PDF — product overview
- [x] 1.6 Investor PDF — competitive analysis
- [x] 1.7 Brand naming options document
- [ ] 1.8 Promote findings into MON-01 implementation change when payment build starts
- [ ] 1.9 Archive this change after MON-01 implementation spec references this research

Implementation (separate change — not this research pack):

- [ ] 2.1 Stripe products: Season Pass £25, Annual £29, Monthly £3.99
- [ ] 2.2 `subscription_tier` + `premium_until` in DB and auth context
- [ ] 2.3 Pricing page + checkout + customer portal
- [ ] 2.4 Wire `getLimit()` and premium gates to tier
- [ ] 2.5 App Store / Play billing evaluation (if required for native IAP)
