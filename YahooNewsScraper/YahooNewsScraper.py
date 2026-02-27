import requests
import urllib.parse
from goose3 import Goose
from bs4 import BeautifulSoup
from .NewsArticle import NewsArticle


class YahooNewsScaper:
    """Class for scraping news articles from Yahoo News using the BeautifulSoup web
    scraping library"""

    def __init__(self):
        """
        Initialises an instance of the YahooNewsScraper class. This constructor sets up
        the base URL required to get articles from Yahoo News.
        """
        self.base_url = "https://news.search.yahoo.com/search"

    def search(
        self,
        query: str,
        page: int = 1,
    ):
        """
        Returns a list of NewsArticle objects, based on the search query and page
        number, scraped from Yahoo News

        Parameters:
        query: Specifies what to search for on Yahoo News
        page: The page number of the search results to return. Each page contains 10
              articles (page numbers are 1-indexed)

        Returns:
            A list of NewsArticle objects
        """
        # Add search query and page number to URL
        url_encoded_query = urllib.parse.quote(query)
        url = self.base_url + f"?q={url_encoded_query}"
        url += f"&b={(10 * (page - 1)) + 1}"

        # Get page and pass to BeautifulSoup
        ynews_page = requests.get(url).text
        doc = BeautifulSoup(ynews_page, "html.parser")
        news_articles = doc.find_all("div", class_="dd NewsArticle")

        # Convert all articles into NewsArticle objects
        articles = []
        for article in news_articles:
            title = article.find(
                "h4", class_="s-title fz-20 lh-m fw-500 ls-027 mt-6 mb-2"
            ).text
            author = article.find("span", class_="s-source fw-l").text
            timestamp = article.find(
                "span", class_="s-time fz-14 lh-18 fc-dustygray fl-l mr-4"
            ).text
            description = article.find(
                "p", class_="s-desc fz-14 lh-1_45x fc-444444"
            ).text
            url = (
                article.find("h4", class_="s-title fz-20 lh-m fw-500 ls-027 mt-6 mb-2")
                .find("a")
                .get("href")
            )

            articles.append(
                NewsArticle(
                    title=title,
                    url=url,
                    timestamp=timestamp,
                    description=description,
                    publisher=author,
                )
            )

        return articles

    @staticmethod
    def get_article_text(url: str):
        """
        Helper method that extracts and returns the meta description and main content
        of an article from the specified URL.

        This function uses the Goose library to extract the main text body from
        webpages. It fetches the article at the provided URL and returns a string,
        combining the meta description and the cleaned text of the article.

        Parameters:
        url (str): The URL of the article from which to extract content

        Returns:
        A string combining the meta description and the main cleaned text of the article
        """
        g = Goose()
        article = g.extract(url=url)

        return article.meta_description + article.cleaned_text
