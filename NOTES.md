# Development Notes

## Installation Notes

If you see TypeScript errors about missing modules before running `npm install`, this is expected. Run `npm install` first to resolve these errors.

## Known Considerations

### LangGraph API
The LangGraph StateGraph API may vary slightly between versions. If you encounter issues with the agent orchestration:
1. Check the LangGraph documentation for the latest API
2. The current implementation uses the channels-based approach
3. You may need to adjust reducer functions based on your LangGraph version

### Database Extensions
Ensure these extensions are enabled in Supabase:
- `uuid-ossp` - For UUID generation
- `vector` - For pgvector embeddings

### Pika Labs API
Video generation requires a Pika Labs API key. The implementation handles missing keys gracefully, but video generation will fail without it.

### OpenAI Rate Limits
Be mindful of OpenAI API rate limits, especially for image generation. Consider:
- Implementing request queuing
- Adding retry logic
- Caching responses where appropriate

### Supabase Storage
Currently, generated images are stored with external URLs. For production:
1. Download images to Supabase Storage
2. Update image URLs to point to Supabase Storage
3. Implement proper bucket policies

### Background Jobs
Content generation is currently synchronous. For better UX:
1. Implement background job processing
2. Use webhooks for video generation status
3. Add progress tracking for users

### Security Considerations
- Never expose service role key to client-side code
- Always validate tenant access in API routes
- Review RLS policies regularly
- Implement rate limiting on API routes

## Testing Checklist

Before deploying:
- [ ] Test user signup and login flow
- [ ] Test tenant creation and onboarding
- [ ] Test content generation for each platform
- [ ] Test image generation
- [ ] Test video generation (if Pika key available)
- [ ] Test content library filtering
- [ ] Test scheduling posts
- [ ] Verify RLS policies work correctly
- [ ] Test multi-tenant data isolation

## Performance Optimization

Future optimizations to consider:
- Implement Redis caching for frequently accessed data
- Use Supabase Edge Functions for heavy operations
- Optimize database queries with proper indexes
- Implement pagination for content library
- Add loading states and skeleton screens
- Implement optimistic updates where appropriate

