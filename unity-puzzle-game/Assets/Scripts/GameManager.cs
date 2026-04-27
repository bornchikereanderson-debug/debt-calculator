using UnityEngine;

public class GameManager : MonoBehaviour
{
    [Header("Gameplay")]
    [SerializeField] private int startingMoves = 20;
    [SerializeField] private int baseTargetScore = 1400;
    [SerializeField] private int targetIncreasePerLevel = 450;
    [SerializeField] private int pointsMultiplier = 10;

    private BoardController boardController;
    private UIManager uiManager;
    private int score;
    private int movesRemaining;
    private int targetScore;
    private int currentLevel = 1;
    private GameFlowState state = GameFlowState.Home;

    public bool CanAcceptInput => state == GameFlowState.Playing && movesRemaining > 0;

    public void Initialize(BoardController board, UIManager ui)
    {
        boardController = board;
        uiManager = ui;
        uiManager.RefreshLevel(currentLevel);
        uiManager.ShowHome();
    }

    public void StartFirstLevel()
    {
        currentLevel = 1;
        StartLevel(currentLevel);
    }

    public void RestartCurrentLevel()
    {
        StartLevel(currentLevel);
    }

    public void AdvanceToNextLevel()
    {
        currentLevel++;
        StartLevel(currentLevel);
    }

    public void ReturnHome()
    {
        state = GameFlowState.Home;
        uiManager.ShowHome();
    }

    public void RegisterPlayerMove(int clearedTileCount)
    {
        if (state != GameFlowState.Playing)
        {
            return;
        }

        movesRemaining = Mathf.Max(0, movesRemaining - 1);
        score += CalculateScore(clearedTileCount);
        uiManager.RefreshHud(score, movesRemaining, targetScore, currentLevel);
    }

    public void EvaluateBoardAfterMove()
    {
        if (state != GameFlowState.Playing)
        {
            return;
        }

        if (score >= targetScore)
        {
            state = GameFlowState.Won;
            uiManager.ShowWin(currentLevel, score, targetScore);
            return;
        }

        if (movesRemaining <= 0)
        {
            state = GameFlowState.Lost;
            uiManager.ShowGameOver(currentLevel, score, targetScore);
        }
    }

    private void StartLevel(int level)
    {
        score = 0;
        movesRemaining = startingMoves;
        targetScore = baseTargetScore + Mathf.Max(0, level - 1) * targetIncreasePerLevel;
        state = GameFlowState.Playing;

        boardController.BuildFreshBoard();
        uiManager.RefreshHud(score, movesRemaining, targetScore, level);
        uiManager.ShowGameplay();
    }

    private int CalculateScore(int groupSize)
    {
        return groupSize * groupSize * pointsMultiplier;
    }

    private enum GameFlowState
    {
        Home,
        Playing,
        Won,
        Lost,
    }
}
