import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

export default function TestResult() {
  const [match, params] = useRoute("/student/tests/result/:attemptId");
  const [, navigate] = useLocation();
  const attemptId = match ? parseInt(params?.attemptId as string) : null;

  // Get the specific test attempt by ID
  const { data: currentAttempt, isLoading: isAttemptsLoading } = useQuery({
    queryKey: [`/api/test-attempts/${attemptId}`],
    enabled: !!attemptId,
  });

  // Fetch test details once we have the attempt
  const testId = currentAttempt?.testId;

  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });

  // Fetch questions for this test
  const { data: questions = [], isLoading: isQuestionsLoading } = useQuery({
    queryKey: [`/api/tests/${testId}/questions`],
    enabled: !!testId,
  });

  const isLoading = isAttemptsLoading || isTestLoading || isQuestionsLoading;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format points to always show 2 decimal places
  const formatPoints = (points: number | string) => {
    if (typeof points === "string") {
      return parseFloat(points).toFixed(2);
    }
    return points.toFixed(2);
  };

  // Get status color based on score
  const getScoreStatus = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      return {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        text: "Passed",
      };
    } else {
      return {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        text: "Failed",
      };
    }
  };

  // Format number display with sign (+ or -)
  const formatNumberWithSign = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return numValue >= 0 ? `+${numValue.toFixed(2)}` : numValue.toFixed(2);
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl">
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  // Error state - no test found
  if (!test || !currentAttempt) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find any test results for this test.
          </p>
          <Button onClick={() => navigate("/student/tests")}>
            Back to Tests
          </Button>
        </div>
      </Layout>
    );
  }

  const scoreStatus = getScoreStatus(currentAttempt.score, test.passingScore);

  // Parse float values from string fields if they exist
  const totalPoints = currentAttempt.totalPointsFloat
    ? parseFloat(currentAttempt.totalPointsFloat)
    : currentAttempt.totalPoints || 0;

  const correctPoints = currentAttempt.correctPointsFloat
    ? parseFloat(currentAttempt.correctPointsFloat)
    : currentAttempt.correctPoints || 0;

  const negativePoints = currentAttempt.negativePointsFloat
    ? parseFloat(currentAttempt.negativePointsFloat)
    : currentAttempt.negativePoints || 0;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center">
          <Button 
            variant="outline" 
            className="mr-4 flex items-center"
            onClick={() => navigate("/student/tests")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tests
          </Button>
          <h1 className="text-2xl font-bold">Test Results</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
            <CardDescription>{test.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">
                  Test Date
                </div>
                <div>
                  {formatDate(
                    currentAttempt.submittedAt || currentAttempt.startedAt,
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">
                  Duration
                </div>
                <div>{test.duration} minutes</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">
                  Questions
                </div>
                <div>{questions.length}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">
                  Passing Score
                </div>
                <div>{test.passingScore}%</div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div className="mb-4 md:mb-0">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Your Score
                </div>
                <div className="text-3xl font-bold flex items-center">
                  <span
                    className={currentAttempt.score < 0 ? "text-red-600" : ""}
                  >
                    {currentAttempt.score}%
                  </span>
                  <div
                    className={`ml-2 py-1 px-2 text-sm rounded-full flex items-center ${scoreStatus.color}`}
                  >
                    {scoreStatus.icon}
                    <span className="ml-1 text-xs font-medium">
                      {scoreStatus.text}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {currentAttempt.score < 0
                      ? currentAttempt.score + "%"
                      : "0%"}
                  </span>
                  <span>{test.passingScore}%</span>
                  <span>100%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden relative">
                  {currentAttempt.score >= 0 ? (
                    <div
                      className={`h-full ${currentAttempt.score >= test.passingScore ? "bg-green-500" : "bg-red-500"}`}
                      style={{
                        width: `${Math.min(100, Math.max(0, currentAttempt.score))}%`,
                      }}
                    ></div>
                  ) : (
                    <>
                      <div className="absolute left-0 h-full w-px bg-black"></div>
                      <div
                        className="h-full bg-red-500 absolute"
                        style={{
                          width: `${Math.min(20, Math.abs(currentAttempt.score))}%`,
                          left: 0,
                        }}
                      ></div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Points Breakdown */}
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-lg mb-3">Points Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded border border-green-200">
                  <div className="text-sm text-gray-500 mb-1">
                    Correct Answers
                  </div>
                  <div className="text-xl font-semibold text-green-600">
                    +{formatPoints(correctPoints)}
                  </div>
                </div>

                {negativePoints > 0 && (
                  <div className="p-3 bg-white rounded border border-red-200">
                    <div className="text-sm text-gray-500 mb-1">
                      Negative Marking
                    </div>
                    <div className="text-xl font-semibold text-red-600">
                      -{formatPoints(negativePoints)}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-white rounded border border-blue-200">
                  <div className="text-sm text-gray-500 mb-1">Total Points</div>
                  <div
                    className={`text-xl font-semibold ${totalPoints >= 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    {formatNumberWithSign(totalPoints)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Analysis</CardTitle>
            <CardDescription>
              Review your answers and see explanations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {questions.map((question: any, index: number) => {
                const userAnswer = currentAttempt.answers?.[question.id];
                const result = currentAttempt.results?.[question.id];
                const isCorrect = result?.correct;
                const pointsValue = result?.points || 0;

                // Get the points for display
                const pointsFloat = question.pointsFloat
                  ? parseFloat(question.pointsFloat)
                  : question.points;
                const negPointsFloat = question.negativePointsFloat
                  ? parseFloat(question.negativePointsFloat)
                  : question.negativePoints || 0;

                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 rounded-full p-1 ${isCorrect ? "bg-green-100" : "bg-red-100"}`}
                      >
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium">
                            {index + 1}. {question.question}
                          </h3>
                          <div className="flex gap-2 items-center">
                            {pointsValue > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                +{pointsValue.toFixed(2)} points
                              </Badge>
                            ) : pointsValue < 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200"
                              >
                                {pointsValue.toFixed(2)} points
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-gray-50 text-gray-700 border-gray-200"
                              >
                                0 points
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 mb-3">
                          {isCorrect ? (
                            <span>Worth {pointsFloat.toFixed(2)} points</span>
                          ) : negPointsFloat > 0 ? (
                            <span className="flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                              Incorrect (-{negPointsFloat.toFixed(2)} points)
                            </span>
                          ) : (
                            <span>Worth {pointsFloat.toFixed(2)} points</span>
                          )}
                        </div>

                        {/* Multiple Choice */}
                        {question.type === "mcq" && (
                          <div className="pl-4 space-y-2 mb-3">
                            {question.options.map((option: any) => {
                              const isUserAnswer = userAnswer === option.id;
                              const isCorrectAnswer =
                                question.correctAnswer.includes(option.id);

                              return (
                                <div
                                  key={option.id}
                                  className={`p-2 rounded ${
                                    isUserAnswer && isCorrectAnswer
                                      ? "bg-green-50 border border-green-200"
                                      : isUserAnswer && !isCorrectAnswer
                                        ? "bg-red-50 border border-red-200"
                                        : !isUserAnswer && isCorrectAnswer
                                          ? "bg-green-50 border border-green-200 opacity-50"
                                          : ""
                                  }`}
                                >
                                  <div className="flex items-center">
                                    {isUserAnswer && isCorrectAnswer && (
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                    )}
                                    {!isUserAnswer && isCorrectAnswer && (
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 opacity-50" />
                                    )}
                                    <span>{option.text}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* True/False */}
                        {question.type === "truefalse" && (
                          <div className="pl-4 space-y-2 mb-3">
                            {["true", "false"].map((value) => {
                              const boolValue = value === "true";
                              const isUserAnswer = userAnswer === boolValue;
                              const isCorrectAnswer =
                                question.correctAnswer === boolValue;

                              return (
                                <div
                                  key={value}
                                  className={`p-2 rounded ${
                                    isUserAnswer && isCorrectAnswer
                                      ? "bg-green-50 border border-green-200"
                                      : isUserAnswer && !isCorrectAnswer
                                        ? "bg-red-50 border border-red-200"
                                        : !isUserAnswer && isCorrectAnswer
                                          ? "bg-green-50 border border-green-200 opacity-50"
                                          : ""
                                  }`}
                                >
                                  <div className="flex items-center">
                                    {isUserAnswer && isCorrectAnswer && (
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                    )}
                                    {!isUserAnswer && isCorrectAnswer && (
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 opacity-50" />
                                    )}
                                    <span>
                                      {value === "true" ? "True" : "False"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Fill in the Blank */}
                        {question.type === "fillblank" && (
                          <div className="pl-4 mb-3">
                            <div className="flex items-start gap-2">
                              <div className="font-medium min-w-[120px]">
                                Your Answer:
                              </div>
                              <div
                                className={
                                  isCorrect ? "text-green-700" : "text-red-700"
                                }
                              >
                                {userAnswer || "No answer provided"}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 mt-2">
                              <div className="font-medium min-w-[120px]">
                                Correct Answer:
                              </div>
                              <div className="text-green-700">
                                {question.correctAnswer}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Subjective */}
                        {question.type === "subjective" && (
                          <div className="pl-4 mb-3">
                            <div className="font-medium mb-1">Your Answer:</div>
                            <div className="bg-gray-50 p-3 rounded border mb-3">
                              {userAnswer || "No answer provided"}
                            </div>
                            <div className="font-medium mb-1">
                              Key Concepts Expected:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {question.correctAnswer.map(
                                (keyword: string, i: number) => (
                                  <span
                                    key={i}
                                    className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-sm"
                                  >
                                    {keyword}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="mt-4 pl-4">
                            <div className="font-medium text-sm mb-1 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1 text-blue-500" />
                              Explanation:
                            </div>
                            <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                              {question.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/student/tests">Back to Tests</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
