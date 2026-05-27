import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedAnswer: z.enum(["A", "B", "C", "D"]),
});

export const getTriviaState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: settings }, { data: session }, { data: questions }] = await Promise.all([
      supabase.from("app_settings").select("key,value").eq("key", "trivia_unlocked").maybeSingle(),
      supabase
        .from("trivia_sessions")
        .select("id,started_at,completed_at,total_score,is_completed")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .maybeSingle(),
      supabase.from("trivia_questions").select("id,question_text,options,points,order_index").order("order_index"),
    ]);

    const unlocked = settings?.value === "true";
    if (!unlocked) return { unlocked: false, lockedReason: "Trivia is currently locked." };

    const existingAnswers = session
      ? await supabase
          .from("trivia_answers")
          .select("question_id,selected_answer,is_correct,points_awarded")
          .eq("session_id", session.id)
      : { data: [] };

    return {
      unlocked: true,
      session: session
        ? {
            id: session.id,
            startedAt: session.started_at,
            completedAt: session.completed_at,
            totalScore: session.total_score,
            isCompleted: session.is_completed,
          }
        : null,
      questions: (questions ?? []).map((q: any) => ({
        id: q.id,
        questionText: q.question_text,
        options: q.options as { letter: string; text: string }[],
        points: q.points,
        orderIndex: q.order_index,
      })),
      answers: (existingAnswers.data ?? []).reduce(
        (acc: Record<string, any>, a: any) => {
          acc[a.question_id] = {
            selectedAnswer: a.selected_answer,
            isCorrect: a.is_correct,
            pointsAwarded: a.points_awarded,
          };
          return acc;
        },
        {} as Record<string, any>
      ),
    };
  });

export const startTriviaSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("trivia_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .maybeSingle();

    if (existing) return { sessionId: existing.id };

    const { data: created, error } = await supabase
      .from("trivia_sessions")
      .insert({ user_id: userId })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { sessionId: created.id };
  });

export const submitTriviaAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AnswerSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify session ownership
    const { data: session } = await supabase
      .from("trivia_sessions")
      .select("id,user_id,is_completed")
      .eq("id", data.sessionId)
      .maybeSingle();

    if (!session || session.user_id !== userId) throw new Error("Unauthorized session.");
    if (session.is_completed) throw new Error("Session already completed.");

    // Prevent duplicate answers
    const { data: existing } = await supabase
      .from("trivia_answers")
      .select("id")
      .eq("session_id", data.sessionId)
      .eq("question_id", data.questionId)
      .maybeSingle();
    if (existing) throw new Error("Answer already submitted for this question.");

    // Fetch correct answer
    const { data: question } = await supabase
      .from("trivia_questions")
      .select("correct_answer,points")
      .eq("id", data.questionId)
      .single();
    if (!question) throw new Error("Question not found.");

    const isCorrect = question.correct_answer === data.selectedAnswer;
    const pointsAwarded = isCorrect ? (question.points ?? 10) : 0;

    const { error } = await supabase.from("trivia_answers").insert({
      session_id: data.sessionId,
      question_id: data.questionId,
      user_id: userId,
      selected_answer: data.selectedAnswer,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
    });

    if (error) throw new Error(error.message);

    return { isCorrect, pointsAwarded };
  });

export const completeTriviaSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: session } = await supabase
      .from("trivia_sessions")
      .select("id,user_id,is_completed")
      .eq("id", data.sessionId)
      .maybeSingle();

    if (!session || session.user_id !== userId) throw new Error("Unauthorized session.");
    if (session.is_completed) throw new Error("Already completed.");

    // Sum points
    const { data: answers } = await supabase
      .from("trivia_answers")
      .select("points_awarded")
      .eq("session_id", data.sessionId);

    const totalScore = (answers ?? []).reduce((sum, a) => sum + (a.points_awarded ?? 0), 0);

    const nowIso = new Date().toISOString();
    await supabase
      .from("trivia_sessions")
      .update({ is_completed: true, completed_at: nowIso, total_score: totalScore })
      .eq("id", data.sessionId);

    // Award to score_events (requires house)
    const { data: profile } = await supabase.from("profiles").select("house").eq("id", userId).maybeSingle();
    const house = profile?.house;

    if (house && totalScore > 0) {
      await supabase.from("score_events").insert({
        user_id: userId,
        house,
        source: "trivia",
        points: totalScore,
      });
    }

    return { totalScore };
  });
