export default {
  fetch(_request, env) {
    return new Response(env.GREETING);
  },
} satisfies ExportedHandler<Env>;
