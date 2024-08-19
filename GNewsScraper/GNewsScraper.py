import requests
import urllib.parse
from typing import List
from goose3 import Goose
from bs4 import BeautifulSoup
from datetime import datetime
from constants import COUNTRY_CODES
from NewsArticle import NewsArticle


class GNewsScraper:
    """Class for scraping news articles from Google News"""

    def __init__(self):
        """
        Initialises an instance of the GNewsScraper class. This constructor sets up the
        base URL required to get articles from Google News, and also creates a set of
        (URLs of) publishers who will be excluded from the search results.
        """
        self.base_url = "https://news.google.com/rss/search"
        self.excluded_publishers = set()  # Excluding by URL

    def search(
        self,
        query: str,
        country: str = "united_kingdom",
        max_results: int = 100,
    ):
        """
        Returns a list of NewsArticle objects, based on the search query and other
        parameters, scraped from Google News

        Parameters:
        query: Specifies what to search for on Google News
        country: The country used to localize searech results. This should be in the
                  form "country_name" (all lowercase and underscores instead of spaces)
        max_results: Maximum number of results to return

        Returns:
            A tuple where the first value is the list of NewsArticle objects and the
            second value is the date and time of when the feed was last updated (in the
            form DD-MM-YYYY HH:MM:SS)
        """
        # Add search query to URL
        url_encoded_query = urllib.parse.quote(query)
        url = self.base_url + f"?q={url_encoded_query}"

        # Add country code to URL
        country_code = "GB" if country not in COUNTRY_CODES else COUNTRY_CODES[country]
        url += f"&hl=en-{country_code}&gl={country_code}"

        # Get page and pass to BeautifulSoup
        gnews_page = requests.get(url).text
        doc = BeautifulSoup(gnews_page, "lxml-xml")
        items = doc.find_all("item")

        # Get time RSS feed was generated
        date_generated = GNewsScraper.convert_date_time(doc.channel.lastBuildDate.text)

        # Convert all items into NewsArticle objects
        articles = []
        for item in items:
            if item.source["url"] not in self.excluded_publishers:
                # Remove " - publisher" from end of title
                title_text = item.title.text
                title_text = " - ".join(title_text.split(" - ")[:-1])

                # Convert time
                published_date = GNewsScraper.convert_date_time(item.pubDate.text)

                articles.append(
                    NewsArticle(
                        title=title_text,
                        url=item.link.text,
                        date=published_date,
                        publisher=item.source.text,
                        publisher_url=item.source["url"],
                    )
                )

        # Limit number of articles if necessary
        if 1 <= max_results <= 100:
            articles = articles[: max_results + 1]

        return articles, date_generated

    def add_excluded_publishers(self, urls: List[str]):
        """
        Adds each URL specified in the "urls" parameter to the GNewsScraper instance's
        excluded_publishers set

        Parameters:
        urls: List of URLs of publishers you want to exclude from the search results.
               Each URL in this list is added to the excluded_publishers set
        """
        for url in urls:
            self.excluded_publishers.add(url.lower())

    def remove_excluded_publishers(self, urls: List[str]):
        """
        Removes each URL specified in the "urls" parameter from the GNewsScraper
        instance's excluded_publishers set

        Parameters:
        urls: List of URLs of publishers you no longer want to exclude from the
               search results. Each URL in this list is removed from the
               excluded_publishers set
        """
        for url in urls:
            self.excluded_publishers.discard(url.lower())

    @staticmethod
    def convert_date_time(date_time: str):
        """
        Helper method that converts strings in "%a, %d %b %Y %H:%M:%S GMT" format (i.e.,
        the format that the Google News RSS feed uses for date and time) into another
        format ("DD-MM-YYYY HH:MM:SS")

        Parameters:
        date_time: String of a date in the form "%a, %d %b %Y %H:%M:%S GMT"

        Returns:
        String in the form "DD-MM-YYYY HH:MM:SS" (the converted date)
        """
        date_obj = datetime.strptime(date_time, "%a, %d %b %Y %H:%M:%S GMT")
        return date_obj.strftime("%d-%m-%Y %H:%M:%S")

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
