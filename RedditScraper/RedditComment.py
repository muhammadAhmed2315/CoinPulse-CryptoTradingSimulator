class RedditComment:
    """Class for storing information about a Reddit comment"""

    def __init__(self, text: str, score: int):
        """
        Intialises the RedditComment object with the required data

        Parameters:
        text: Comment text
        score: Net number of upvotes minus number of downvotes
        """
        self.text = text
        self.score = score
