import { useQuery } from 'react-query';

export const RepoData = () => {
  const { isLoading, error, data } = useQuery('repoData', () =>
    fetch('https://api.github.com/repos/tannerlinsley/react-query').then(
      (response) => response.json(),
    ),
  );

  if (isLoading) return 'Loading...';

  if (error)
    return (
      'An error has occurred: ' +
      (error instanceof Error ? error.message : 'Unknown error')
    );

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <strong>👀 {data.subscribers_count}</strong>{' '}
      <strong>✨ {data.stargazers_count}</strong>{' '}
      <strong>🍴 {data.forks_count}</strong>
    </div>
  );
};
